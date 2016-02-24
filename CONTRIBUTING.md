Hello, it looks like you're considering contributing to Maid-IRC. Please read the following carefully, it's important. Thank you for considering contributing to Maid-IRC.

**[Issues](#issues) | [Pull Request](#pull-request) | [Guidelines](#guidelines)**

---

## Issues

Please include as much information as possible regarding the bug. The following information will make our job easier when we attempt to address your issue:

- **Maid-IRC version** Is it a current or past release? Please include the version number.
- **Steps for reproducing the problem** Assuming the issue is reproducible, please include steps explaining how to do so.
- **Operating system and/or web browser** If its an issue on the server you probably wont need to include the web browser.
- **Related issues** If a similar or related issue has been reported before, please include that in your issue.

### Questions

If your issue is a question, please ask us via IRC or twitter. Our IRC and Twitter contact information is available [here](README.md#community).

### Feature request

If you have a suggestion or a feature request we prefer you do so by opening up a new issue. Before you do so, please check if somebody has already requested the same feature.

## Pull Request

- Fork Maid-IRC
- All checks must pass

## Guidelines

There are several guidelines that will need to be followed when contributing to Maid-IRC.

When communicating through one of Maid-IRC's channels, be it IRC or Github, please adhere to our [Code of Conduct](https://github.com/Phalanxia/Maid-IRC/wiki/Code-of-Conduct).

### Code

Please keep code short and sweet unless otherwise impossible.

#### Less and HTML

- [Code Guide by @mdo](https://github.com/mdo/code-guide)
- [Less Coding Guidelines](https://gist.github.com/fat/a47b882eb5f84293c4ed)

There are several things we do differently than otherwise specified in these guidelines:

- If they're conflictions in the guides, use code we already wrote as examples of what to do, if there isn't any, do what you think is best.
- Keep HTML tags and attributes **lowercase** unless otherwise required by the spec.
- **@import is okay** and actually required in the Less files due to the modularized way they're coded.
- Prefixed Less properties use Less [Parametric Mixins](http://lesscss.org/features/#mixins-parametric-feature) from the [polyfills.less](https://github.com/Phalanxia/Maid-IRC/blob/master/src/client/less/polyfills.less) file.
- Use hard tabs instead of soft tabs, unless the language doesn't support it.

#### JavaScript
JavaScript code must comply with [github.com/airbnb/javascript](https://github.com/airbnb/javascript)
