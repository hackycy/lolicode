# @lolicode/renderer-canvas

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Canvas renderer for lolicode. It renders matrix codes and linear barcodes to a browser canvas element or a compatible 2D context.

## Install

```bash
pnpm add @lolicode/renderer-canvas
```

## Quick Start

```ts
import { renderCanvas } from '@lolicode/renderer-canvas'

const canvas = document.querySelector('canvas')!

renderCanvas('5901234123457', {
  type: 'ean13',
  target: canvas,
  moduleSize: 3,
  encode: {
    quietZone: 12,
    height: 40,
  },
})
```

## Render QR Code

```ts
import { renderCanvas } from '@lolicode/renderer-canvas'

renderCanvas('https://github.com/hackycy/lolicode', {
  type: 'qrcode',
  target: document.querySelector('canvas')!,
  moduleSize: 6,
  foreground: '#111827',
  background: '#ffffff',
  encode: {
    errorLevel: 'H',
    margin: 2,
  },
})
```

## Render Existing Matrix Data

```ts
import { code128 } from '@lolicode/core'
import { renderCanvas } from '@lolicode/renderer-canvas'

const matrix = code128('ABC-123', { height: 32 })

renderCanvas(matrix, {
  target: document.querySelector('canvas')!,
  moduleSize: 2,
})
```

## API

### `renderCanvas(input, options)`

Draws to the provided target and returns the resolved 2D context.

Accepted inputs:

- A `DotMatrix` from `@lolicode/core`
- A raw `Array<Array<0 | 1>>`
- A declarative request such as `{ type, content, options }`
- A string content value when `options.type` is provided

### `CanvasRenderer`

Class wrapper that implements the shared renderer interface:

```ts
import { CanvasRenderer } from '@lolicode/renderer-canvas'

const renderer = new CanvasRenderer()
renderer.render({ type: 'qrcode', content: 'LOLICODE' }, {
  target: document.querySelector('canvas')!,
})
```

## Options

| Option | Description |
| --- | --- |
| `target` | Required canvas element or compatible 2D context. |
| `type` | Code type when rendering from string content. |
| `encode` | Encoder options passed to `@lolicode/core`. |
| `moduleSize` | Pixel size of each matrix module. Defaults to `4`. |
| `foreground` | Filled module color. Defaults to `#000000`. |
| `background` | Empty module background. Defaults to `#FFFFFF`. |

The renderer resizes the canvas target to match the encoded matrix dimensions and selected `moduleSize`.

## License

[MIT](../../LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-canvas?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/renderer-canvas
[npm-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-canvas?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/renderer-canvas
[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE
