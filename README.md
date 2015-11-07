[![Maid IRC](public/img/logo_medium.png)](https://github.com/Phalanxia/Maid-IRC "Maid-IRC")
==

[![Build Status](https://img.shields.io/travis/Phalanxia/Maid-IRC.svg?style=flat-square)](https://travis-ci.org/Phalanxia/Maid-IRC) [![NPM version](https://img.shields.io/npm/v/maid-irc.svg?style=flat-square)](https://www.npmjs.org/package/maid-irc) [![Dependency Status](https://img.shields.io/gemnasium/Phalanxia/Maid-IRC.svg?style=flat-square)](https://gemnasium.com/Phalanxia/Maid-IRC) [![Downloads](https://img.shields.io/npm/dm/maid-irc.svg?style=flat-square)](https://www.npmjs.org/package/maid-irc) [![Pateon](https://img.shields.io/badge/Patreon-%E2%99%A1-ff69b4.svg?style=flat-square)](https://www.patreon.com/Phalanxia)

A modern web IRC client. Built on [Node](https://nodejs.org).

*Still in early development. Features and bugs may or may not be included.*

**[Screenshots](#screenshots) | [Building](#building) | [Running](#running) | [Community](#community) | [License](#license)**

---

## Screenshots

![Connect](screenshots/login.png "Login screenshot")

![Client](screenshots/client.png "Client screenshot")

## Building

Don't feel like building? Prebuilt versions are available [here](https://github.com/Phalanxia/Maid-IRC/releases). Prebuilds are intended for production environments only and don't include files not necessary in production.

### Prerequisites

Maid-IRC requires Node.js v4.1.x or newer.

**Note:** Package manager-provided versions may not satisfy this requirement. The [Node.js site](https://nodejs.org/en/download/stable/) provides recent binaries for all the platforms.

#### Building on Debian and derivatives

At the time of writing Debian 8 "jessie" provides Node.js version 0.10.29. You may use nvm, n, nave or download directly from the aforementioned official site to meet the requirements for this app. [npm](https://www.npmjs.com/), which may or may not be packaged with Node.js, is also required.

ICU dev headers are needed to successfully build npm dependencies.

Install the prerequisites:
```bash
$ sudo apt-get install libicu-dev git
```

---

Install grunt-cli:
```bash
$ sudo npm install -g grunt-cli
```

Clone the repository:
```bash
$ git clone https://github.com/Phalanxia/Maid-IRC.git
```

Set the working directory to the freshly obtained copy and install the nodejs dependencies
```bash
$ cd Maid-IRC; npm install
```

Compile .less files:
```bash
$ grunt build:css
```

Compile public JavaScript with babel:
```bash
$ grunt build:js
```

##### Optional:
Generating a production ready zip file
```bash
$ grunt package
```

## Running
```bash
$ node maid.js
```
**Recomended:** Look at 'config.js' and configure it to your liking.

**Optional:** (Not available in prebuilts) Please define the node environment variable. Supported variables are `development` and `production`. Will default to production if not defined.

## Community

Found a bug? Have a feature request? Please [submit an issue](https://github.com/Phalanxia/Maid-IRC/issues).

Need support? Wanna chat? Join our channel on the Freenode IRC network.

	HOST: irc.freenode.net
	CHANNEL: ##phalanxia

## License

[MIT License](LICENSE) © 2015 Madison Tries
