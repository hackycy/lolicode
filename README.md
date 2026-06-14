# lolicode

[![License][license-src]][license-href]

Lolicode is a TypeScript toolkit for generating matrix codes and linear barcodes, then rendering them through framework-neutral renderers or Vue components.

## Packages

| Package | Version | Downloads | Summary |
| --- | --- | --- | --- |
| [@lolicode/core](./packages/core) | [![npm version][core-version-src]][core-npm-href] | [![npm downloads][core-downloads-src]][core-npm-href] | Encoders, shared types, declarative `encode`, and low-level dot matrix output. |
| [@lolicode/renderer-svg](./packages/renderer-svg) | [![npm version][svg-version-src]][svg-npm-href] | [![npm downloads][svg-downloads-src]][svg-npm-href] | Render codes to SVG strings or SVG data URLs. |
| [@lolicode/renderer-canvas](./packages/renderer-canvas) | [![npm version][canvas-version-src]][canvas-npm-href] | [![npm downloads][canvas-downloads-src]][canvas-npm-href] | Render codes to browser canvas elements or compatible 2D contexts. |
| [@lolicode/renderer-terminal](./packages/renderer-terminal) | [![npm version][terminal-version-src]][terminal-npm-href] | [![npm downloads][terminal-downloads-src]][terminal-npm-href] | Render matrix codes as terminal-friendly text for scripts and debugging. |
| [@lolicode/vue](./packages/vue) | [![npm version][vue-version-src]][vue-npm-href] | [![npm downloads][vue-downloads-src]][vue-npm-href] | Vue 3 component wrapper with selectable SVG or Canvas renderer. |

## Supported Codes

Matrix codes:

- QR Code
- Data Matrix
- PDF417
- Aztec

Linear barcodes:

- Code 128
- Code 39
- Code 93
- Codabar
- GS1-128
- MSI Plessey
- EAN-13
- EAN-8
- UPC-A
- UPC-E
- ITF

## Quick Start

Install the package that matches your rendering target:

```bash
pnpm add @lolicode/renderer-svg
```

Render a QR Code as SVG:

```ts
import { renderSVG } from '@lolicode/renderer-svg'

const svg = renderSVG('https://github.com/hackycy/lolicode', {
  type: 'qrcode',
  encode: {
    errorLevel: 'Q',
    margin: 2,
  },
  moduleSize: 6,
})
```

Use the Vue component when the code should be managed by a Vue app:

```vue
<script setup lang="ts">
import { Lolicode } from '@lolicode/vue'
</script>

<template>
  <Lolicode
    content="LOLICODE"
    type="qrcode"
    renderer="svg"
    :module-size="6"
    :encode="{ errorLevel: 'H', margin: 2 }"
  />
</template>
```

## Choosing a Package

Use `@lolicode/core` when you need raw dot matrix data, custom renderers, or direct encoder access.

Use `@lolicode/renderer-svg` for server-side HTML, static output, docs, email-safe image sources through data URLs, or apps that prefer DOM-free rendering.

Use `@lolicode/renderer-canvas` for browser interfaces that redraw frequently, need direct canvas control, or integrate with an existing canvas workflow.

Use `@lolicode/renderer-terminal` for Node scripts, CLI examples, and development diagnostics. It supports matrix codes only.

Use `@lolicode/vue` when you want a Vue 3 component with the same encoding options and selectable `svg` or `canvas` renderer.

## Development

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

This project uses npm Trusted Publisher. Releases are created by CI after the package is connected on npm.

## License

[MIT](./LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE

[core-version-src]: https://img.shields.io/npm/v/@lolicode/core?style=flat&colorA=080f12&colorB=1fa669
[core-downloads-src]: https://img.shields.io/npm/dm/@lolicode/core?style=flat&colorA=080f12&colorB=1fa669
[core-npm-href]: https://npmjs.com/package/@lolicode/core

[svg-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-svg?style=flat&colorA=080f12&colorB=1fa669
[svg-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-svg?style=flat&colorA=080f12&colorB=1fa669
[svg-npm-href]: https://npmjs.com/package/@lolicode/renderer-svg

[canvas-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-canvas?style=flat&colorA=080f12&colorB=1fa669
[canvas-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-canvas?style=flat&colorA=080f12&colorB=1fa669
[canvas-npm-href]: https://npmjs.com/package/@lolicode/renderer-canvas

[terminal-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-terminal?style=flat&colorA=080f12&colorB=1fa669
[terminal-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-terminal?style=flat&colorA=080f12&colorB=1fa669
[terminal-npm-href]: https://npmjs.com/package/@lolicode/renderer-terminal

[vue-version-src]: https://img.shields.io/npm/v/@lolicode/vue?style=flat&colorA=080f12&colorB=1fa669
[vue-downloads-src]: https://img.shields.io/npm/dm/@lolicode/vue?style=flat&colorA=080f12&colorB=1fa669
[vue-npm-href]: https://npmjs.com/package/@lolicode/vue
