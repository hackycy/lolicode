# lolicode

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Monorepo for the lolicode TypeScript packages.

## Packages

- [`@lolicode/core`](./packages/core) - Core package for the lolicode workspace.

## Note for Developers

This repository follows the `starter-ts` release flow and recommends using [npm Trusted Publisher](https://github.com/e18e/ecosystem-issues/issues/201), where releases are done on CI to improve package publishing security.

To do so, you need to run `pnpm publish` manually for the very first time to create the package on npm, and then go to `https://www.npmjs.com/package/@lolicode/core/access` to connect it to this GitHub repository.

After that, future releases can use `pnpm run release` and the GitHub Actions workflow will publish the package.

## License

[MIT](./LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/%40lolicode%2Fcore?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/core
[npm-downloads-src]: https://img.shields.io/npm/dm/%40lolicode%2Fcore?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/core
[license-src]: https://img.shields.io/github/license/hackycy-collection/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy-collection/lolicode/blob/main/LICENSE
