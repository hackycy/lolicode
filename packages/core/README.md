# @lolicode/core

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Core encoders and shared TypeScript types for lolicode. This package returns dot matrix data and does not render images by itself.

## Install

```bash
pnpm add @lolicode/core
```

## Quick Start

Use the declarative `encode` API when the code type is selected dynamically:

```ts
import { encode } from '@lolicode/core'

const matrix = encode({
  type: 'qrcode',
  content: 'https://github.com/hackycy/lolicode',
  options: {
    errorLevel: 'Q',
    margin: 2,
  },
})

console.log(matrix.width, matrix.height, matrix.metadata.type)
```

Use a shortcut function when the code type is known:

```ts
import { code128, qr } from '@lolicode/core'

const qrMatrix = qr('LOLICODE', {
  errorLevel: 'H',
  mode: 'alphanumeric',
})

const barcode = code128('ABC-123', {
  height: 32,
  quietZone: 12,
})
```

## Supported Codes

| Family | Types |
| --- | --- |
| Matrix | `qrcode`, `datamatrix`, `pdf417`, `aztec` |
| Linear | `code128`, `code39`, `code93`, `codabar`, `gs1_128`, `msi`, `ean13`, `ean8`, `upca`, `upce`, `itf` |

## API

### `encode(request)`

Encodes a declarative request into a `DotMatrix`.

```ts
import { encode } from '@lolicode/core'

const matrix = encode({
  type: 'ean13',
  content: '5901234123457',
})
```

### Shortcut Encoders

The package exports these shortcut functions:

```text
qr(content, options?)
dataMatrix(content, options?)
pdf417(content, options?)
aztec(content, options?)
code128(content, options?)
code39(content, options?)
code93(content, options?)
codabar(content, options?)
gs1_128(content, options?)
msi(content, options?)
ean13(content, options?)
ean8(content, options?)
upca(content, options?)
upce(content, options?)
itf(content, options?)
```

### Encoder Classes

Use encoder classes when you need an instance-oriented integration point:

```ts
import { QREncoder } from '@lolicode/core'

const encoder = new QREncoder()
const matrix = encoder.encode('LOLICODE', { errorLevel: 'M' })
```

## Dot Matrix Shape

All encoders return:

```ts
interface DotMatrix {
  data: Array<Array<0 | 1>>
  width: number
  height: number
  metadata: {
    type: string
    family: 'matrix' | 'linear'
    generatedAt: number
    version?: number
    errorLevel?: 'L' | 'M' | 'Q' | 'H'
    contentLength?: number
  }
}
```

`data` is renderer-neutral: `1` means filled and `0` means empty.

## Common Options

### QR Code

```ts
qr('LOLICODE', {
  margin: 4,
  version: 4,
  errorLevel: 'Q',
  mode: 'alphanumeric',
})
```

| Option | Description |
| --- | --- |
| `margin` | Quiet zone in modules. Defaults to `4`. |
| `version` | QR version from `1` to `40`. Omit for automatic selection. |
| `errorLevel` | Error correction level: `L`, `M`, `Q`, or `H`. Defaults to `M`. |
| `mode` | Encoding mode: `numeric`, `alphanumeric`, or `byte`. Omit for automatic selection. |

### Linear Barcodes

```ts
code128('ABC-123', {
  moduleWidth: 2,
  height: 32,
  quietZone: 10,
  verticalMargin: 1,
})
```

| Option | Description |
| --- | --- |
| `moduleWidth` | Horizontal width of a narrow module. |
| `height` | Bar body height in rows. |
| `quietZone` | Left and right quiet zone width. |
| `verticalMargin` | Top and bottom whitespace height. |

## Utilities

The package also exports matrix helpers:

```ts
import { addMargin, invertMatrix, resizeMatrix, validateContent } from '@lolicode/core'
```

## License

[MIT](../../LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lolicode/core?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/core
[npm-downloads-src]: https://img.shields.io/npm/dm/@lolicode/core?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/core
[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE
