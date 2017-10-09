#!/usr/bin/env node

const Rega = require('homematic-rega');
const xmlrpc = require('homematic-xmlrpc');
const binrpc = require('binrpc');
const pjson = require('persist-json')('check_homematic');

let names = {};

const yargs = require('yargs') // eslint-disable-line no-unused-vars
    .usage('$0 <cmd> [args]')
    .option('host', {
        alias: 'H',
        required: true
    })
    .command('rega', 'check ReGaHSS', yargs => {
        yargs.option('port', {
            describe: 'Rega Port',
            default: 8181
        });
    }, checkRega)
    .command('rfd', 'check RFD', yargs => {
        yargs.option('port', {
            describe: 'RFD Port',
            default: 2001
        });
    }, checkRfd)
    .command('hs485d', 'check HS485D', yargs => {
        yargs.option('port', {
            describe: 'HS485D Port',
            default: 2000
        });
    }, checkHs485d)
    .command('hmip', 'check HmIP', yargs => {
        yargs.option('port', {
            describe: 'HmIP Port',
            default: 2010
        });
    }, checkHmip)
    .command('cuxd', 'check CUxD', yargs => {
        yargs.option('port', {
            describe: 'CUxD Port',
            default: 8701
        });
    }, checkCuxd)
    .command('sync', 'sync Rega Names', yargs => {
        yargs.option('port', {
            describe: 'Rega Port',
            default: 8181
        });
    }, syncNames)
    .argv;

function checkRega(options) {
    const rega = new Rega({
        host: options.host,
        port: options.port
    });
    rega.exec('Write("ok");', (err, res) => {
        if (!err && res === 'ok') {
            console.log('ReGaHSS OK');
            process.exit(0);
        } else {
            console.log('ReGaHSS CRITICAL', (err && err.message));
            process.exit(2);
        }
    });
}

function checkRfd(options) {
    const p = pjson.load('names-' + options.host) || {};
    if (!p.date || ((new Date()).getTime() - p.date) > (24 * 60 * 60 * 1000)) {
        syncNames(options, () => {
            checkRfd(options);
        });
        return;
    }
    names = p.names || {};

    const rpcClient = binrpc.createClient({host: options.host, port: options.port});
    rpcClient.methodCall('getServiceMessages', [], (err, res) => {
        if (err) {
            console.log('RFD CRITICAL -', (err && err.message));
            process.exit(2);
        } else {
            const unreach = [];
            const lowbat = [];
            if (res.forEach) {
                res.forEach(sm => {
                    const dev = sm[0].replace(':0', '');
                    if (sm[1] === 'UNREACH') {
                        unreach.push(names[dev] || dev);
                    } else if (sm[1] === 'LOWBAT' || sm[1] === 'LOW_BAT') {
                        lowbat.push(names[dev] || dev);
                    }
                });
            }

            if (unreach.length > 0 || lowbat.length > 0) {
                console.log(
                    'RFD WARNING',
                    (unreach.length > 0 ? ('- ' + unreach.length + ' UNREACH: ' + unreach.join(', ')) : ''),
                    (lowbat.length > 0 ? ('- ' + lowbat.length + ' LOWBAT: ' + lowbat.join(', ')) : '')
                );
                process.exit(1);
            } else {
                console.log('RFD OK');
                process.exit(0);
            }
        }
    });
}

function checkHs485d(options) {
    const rpcClient = binrpc.createClient({host: options.host, port: options.port});
    rpcClient.methodCall('getLGWStatus', [], (err, res) => {
        if (err) {
            console.log('HS485D CRITICAL', (err && err.message));
            process.exit(2);
        } else if (res && res.CONNECTED === true) {
            console.log('HS485D OK - Gateway', res.SERIAL, 'connected');
            process.exit(0);
        } else if (res && res.CONNECTED === false) {
            console.log('HS485D CRITICAL - Gateway', res.SERIAL, 'disconnected');
            process.exit(2);
        } else {
            console.log('HS485D CRITICAL');
            process.exit(2);
        }
    });
}

function checkHmip(options) {
    const rpcClient = xmlrpc.createClient({host: options.host, port: options.port});
    // TODO getServiceMessages like in checkRfd() instead of getVersion - https://github.com/eq-3/occu/issues/54
    rpcClient.methodCall('getVersion', [], (err, res) => {
        if (err) {
            console.log('HmIP CRITICAL -', (err && err.message));
            process.exit(2);
        } else if (res) {
            console.log('HmIP OK');
            process.exit(0);
        } else {
            console.log('HmIP CRITICAL');
            process.exit(2);
        }
    });
}

function checkCuxd(options) {
    const rpcClient = binrpc.createClient({host: options.host, port: options.port});
    rpcClient.methodCall('system.listMethods', [], (err, res) => {
        if (err) {
            console.log('CUxD CRITICAL -', (err && err.message));
            process.exit(2);
        } else if (res) {
            console.log('CUxD OK');
            process.exit(0);
        } else {
            console.log('CUxD CRITICAL');
            process.exit(2);
        }
    });
}

function syncNames(options, callback) {
    const rega = new Rega({
        host: options.host,
        port: 8181
    });
    rega.exec(`
string sDevId;
foreach(sDevId, root.Devices().EnumUsedIDs()) {
    var d = dom.GetObject(sDevId);
    WriteLine(d.Address() # " " # d.Name());
}
                `, (err, res) => {
        if (!err) {
            const lines = res.split('\r\n');
            lines.forEach(line => {
                if (line !== '') {
                    names[line.substr(0, line.indexOf(' '))] = line.substr(line.indexOf(' ') + 1);
                }
            });
            pjson.save('names-' + options.host, {date: (new Date()).getTime(), names});
        }
        if (typeof callback === 'function') {
            callback();
        }
    });
}
