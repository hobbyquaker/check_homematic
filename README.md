# check_homematic

[![NPM version](https://badge.fury.io/js/check_homematic.svg)](http://badge.fury.io/js/check_homematic)
[![dependencies Status](https://david-dm.org/hobbyquaker/check_homematic/status.svg)](https://david-dm.org/hobbyquaker/check_homematic)
[![Build Status](https://travis-ci.org/hobbyquaker/check_homematic.svg?branch=master)](https://travis-ci.org/hobbyquaker/check_homematic)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License][mit-badge]][mit-url]

> Nagios/Icinga Plugin for checking Homematic CCU


## Install

Prerequisite: Node.js >= 6

`$ sudo npm install -g check_homematic`


## Command Line Options

``` 
check_homematic <cmd> [args]

Commands:
  rega    check ReGaHSS
  rfd     check RFD
  hs485d  check HS485D
  hmip    check HmIP
  cuxd    check CUxD

Options:
  --help      Show help                                                [boolean]
  --version   Show version number                                      [boolean]
  --host, -H                                                          [required]
```


## Nagios Configuration

#### Command Definition

```
define command {
        command_name            check_homematic
        command_line            /usr/local/bin/check_homematic -H $HOSTNAME$ $ARG1$
}
```

#### Service Definition Example
```
define host {
        use                     generic-host
        host_name               homematic-ccu2
        alias                   homematic-ccu2
        address                 192.168.2.100
}


define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     RFD
        check_command           check_homematic!rfd
}
define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     HmIP
        check_command           check_homematic!hmip
}
define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     HS485D
        check_command           check_homematic!hs485d
}
define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     CUxD
        check_command           check_homematic!cuxd
}
define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     ReGaHSS
        check_command           check_homematic!rega
}


define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     WebUI
        check_command           check_http
}
define service {
        use                     generic-service
        host_name               homematic-ccu2
        service_description     SSH
        check_command           check_ssh
}
```

## License

MIT (c) 2017 [Sebastian Raff](https://github.com/hobbyquaker)

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE
