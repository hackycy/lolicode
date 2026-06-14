# @lolicode/renderer-terminal

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Terminal renderer for lolicode. It renders matrix codes as text for Node scripts, CLI examples, and debugging workflows.

## Install

```bash
pnpm add @lolicode/renderer-terminal
```

## Quick Start

```ts
import { renderTerminal } from '@lolicode/renderer-terminal'

const output = renderTerminal('LOLICODE', {
  type: 'qrcode',
  encode: {
    errorLevel: 'M',
    margin: 1,
  },
  mode: 'utf8',
})

console.log(output)
```

## Render Modes

```ts
renderTerminal('LOLICODE', { type: 'qrcode', mode: 'utf8' })
renderTerminal('LOLICODE', { type: 'qrcode', mode: 'ansi' })
renderTerminal('LOLICODE', { type: 'qrcode', mode: 'small' })
```

| Mode | Description |
| --- | --- |
| `utf8` | Compact block-character output. |
| `ansi` | ANSI background color cells. |
| `small` | Compact ANSI output using half-block characters. |

## Supported Inputs

The terminal renderer supports matrix code types:

- `qrcode`
- `datamatrix`
- `pdf417`
- `aztec`

Linear barcodes are intentionally rejected by this package because terminal cells are not a reliable barcode scanning target. Use `@lolicode/renderer-svg` or `@lolicode/renderer-canvas` for linear barcodes.

## API

### `renderTerminal(input, options?)`

Returns a string suitable for terminal output.

Accepted inputs:

- A `DotMatrix` from `@lolicode/core`
- A raw `Array<Array<0 | 1>>`
- A declarative request such as `{ type, content, options }`
- A string content value when `options.type` is provided

### `TerminalRenderer`

Class wrapper that implements the shared renderer interface:

```ts
import { TerminalRenderer } from '@lolicode/renderer-terminal'

const renderer = new TerminalRenderer()
const output = renderer.render({ type: 'qrcode', content: 'LOLICODE' })
```

## Options

| Option | Description |
| --- | --- |
| `type` | Matrix code type when rendering from string content. |
| `encode` | Encoder options passed to `@lolicode/core`. |
| `mode` | `utf8`, `ansi`, or `small`. Defaults to `utf8`. |
| `margin` | Extra terminal-only whitespace around the matrix. |
| `invert` | Swaps filled and empty cells for terminal output. |

## License

[MIT](../../LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lolicode/renderer-terminal?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/renderer-terminal
[npm-downloads-src]: https://img.shields.io/npm/dm/@lolicode/renderer-terminal?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/renderer-terminal
[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE
