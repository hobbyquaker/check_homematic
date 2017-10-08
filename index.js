#!/usr/bin/env node

const Rega = require('homematic-rega');
const xmlrpc = require('homematic-xmlrpc');
const binrpc = require('binrpc');

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
    const rpcClient = binrpc.createClient({host: options.host, port: options.port});
    rpcClient.methodCall('getServiceMessages', [], (err, res) => {
        if (err) {
            console.log('RFD CRITICAL -', (err && err.message));
            process.exit(2);
        } else {
            let unreach = 0;
            let lowbat = 0;
            if (res.forEach) {
                res.forEach(sm => {
                    if (sm[1] === 'UNREACH') {
                        unreach += 1;
                    } else if (sm[1] === 'LOWBAT' || sm[1] === 'LOW_BAT') {
                        lowbat += 1;
                    }
                });
            }
            if (unreach > 0 || lowbat > 0) {
                console.log(
                    'RFD WARNING',
                    (unreach ? ('- UNREACH: ' + unreach) : ''),
                    (lowbat ? ('- LOWBAT: ' + lowbat) : '')
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
