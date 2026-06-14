# @lolicode/renderer-svg

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

SVG renderer for lolicode. It can render raw dot matrix data or encode content directly when a code `type` is provided.

## Install

```bash
pnpm add @lolicode/renderer-svg
```

## Quick Start

```ts
import { renderSVG } from '@lolicode/renderer-svg'

const svg = renderSVG('https://github.com/hackycy/lolicode', {
  type: 'qrcode',
  encode: {
    errorLevel: 'Q',
    margin: 2,
  },
  moduleSize: 6,
  foreground: '#111827',
  background: '#ffffff',
})
```

## Render to an Image Source

Use `renderDataURL` when the output should be assigned to an `img` element:

```ts
import { renderDataURL } from '@lolicode/renderer-svg'

const src = renderDataURL('LOLICODE', {
  type: 'qrcode',
  encode: {
    errorLevel: 'H',
    margin: 2,
  },
  moduleSize: 5,
})

document.querySelector('img')!.src = src
```

## Render Existing Matrix Data

```ts
import { qr } from '@lolicode/core'
import { renderSVG } from '@lolicode/renderer-svg'

const matrix = qr('LOLICODE')
const svg = renderSVG(matrix, { moduleSize: 4 })
```

## API

### `renderSVG(input, options?)`

Returns an SVG string.

Accepted inputs:

- A `DotMatrix` from `@lolicode/core`
- A raw `Array<Array<0 | 1>>`
- A declarative request such as `{ type, content, options }`
- A string content value when `options.type` is provided

### `renderDataURL(input, options?)`

Returns a `data:image/svg+xml;charset=utf-8,...` URL generated from `renderSVG`.

### `SVGRenderer`

Class wrapper that implements the shared renderer interface:

```ts
import { SVGRenderer } from '@lolicode/renderer-svg'

const renderer = new SVGRenderer()
const svg = renderer.render({ type: 'qrcode', content: 'LOLICODE' })
```

## Options

| Option | Description |
| --- | --- |
| `type` | Code type when rendering from string content. |
| `encode` | Encoder options passed to `@lolicode/core`. |
| `moduleSize` | Pixel size of each matrix module. Defaults to `4`. |
| `foreground` | Filled module color. Defaults to `#000000`. |
| `background` | Empty module background. Defaults to `#FFFFFF`. |
| `includeDeclaration` | Adds an XML declaration before the SVG. |

## License

[MIT](../../LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-svg?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/renderer-svg
[npm-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-svg?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/renderer-svg
[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE
