[![Maid IRC](src/client/img/logo_medium.png)](https://github.com/Phalanxia/Maid-IRC "Maid-IRC")
==

[![Build Status](https://img.shields.io/travis/Phalanxia/Maid-IRC.svg?style=flat-square)](https://travis-ci.org/Phalanxia/Maid-IRC) [![NPM version](https://img.shields.io/npm/v/maid-irc.svg?style=flat-square)](https://www.npmjs.org/package/maid-irc) [![Dependency Status](https://img.shields.io/gemnasium/Phalanxia/Maid-IRC.svg?style=flat-square)](https://gemnasium.com/Phalanxia/Maid-IRC) [![Downloads](https://img.shields.io/npm/dm/maid-irc.svg?style=flat-square)](https://www.npmjs.org/package/maid-irc)

A modern web IRC client. Built on [Node](https://nodejs.org).

*Still in early development. Features and bugs may or may not be included.*

**[Screenshots](#screenshots) | [Installation](#installation) | [Building](#building) | [Running](#running) | [Community](#community) | [License](#license)**

---

## Screenshots

![Connect](screenshots/login.png "Connection screen screenshot")

![Client](screenshots/client.png "Client screenshot")

## Installation

Maid-IRC prefers to be installed globally, though this isn't required.

```bash
$ npm install -g maid-irc
```

If you don't wish to install globally, just omit '-g'.

**Note:** Installing without NPM or a prebuilt will require you to build Maid-IRC. See [below](#building).

## Building

Information regarding building is available on the wiki page [here](https://github.com/Phalanxia/Maid-IRC/wiki/Building). You can skip building if you install Maid-IRC globally via NPM, or download a prebuilt [here](https://github.com/Phalanxia/Maid-IRC/releases).

## Running

If installed globally, start Maid-IRC with the command:

```bash
$ maid start
```

Otherwise navigate to the directory of Maid-IRC in your console and run:

```bash
$ npm start
```
**Recommended:** Look at 'config.yml' and configure it to your liking.

**Optional:** (Not available in prebuilts) Please define the node environment variable. Supported variables are `development` and `production`. Will default to production if not defined.

## Community

[![Twitter](https://img.shields.io/badge/Twitter-%40MaidIRC-55acee.svg?style=flat-square)](https://twitter.com/MaidIRC)

Found a bug? Have a feature request? Please [submit an issue](https://github.com/Phalanxia/Maid-IRC/issues).

Need support? Wanna chat? Join our channel on the Freenode IRC network.

	HOST: irc.freenode.net
	CHANNEL: #Maid-IRC

## License

[MIT License](LICENSE) © 2013-2016 Madison Tries
