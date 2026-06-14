# @lolicode/vue

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Vue 3 component wrapper for lolicode. The component encodes content and renders it through SVG or Canvas with the same options used by the renderer packages.

## Install

```bash
pnpm add @lolicode/vue
```

`vue` is a peer dependency and should already be installed by your application.

## Quick Start

```vue
<script setup lang="ts">
import { Lolicode } from '@lolicode/vue'
</script>

<template>
  <Lolicode
    content="https://github.com/hackycy/lolicode"
    type="qrcode"
    renderer="svg"
    :module-size="6"
    :encode="{ errorLevel: 'Q', margin: 2 }"
  />
</template>
```

## Select a Renderer

Use SVG for markup output:

```vue
<Lolicode
  content="LOLICODE"
  type="qrcode"
  renderer="svg"
  foreground="#111827"
  background="#ffffff"
/>
```

Use Canvas for canvas-based screens:

```vue
<Lolicode
  content="5901234123457"
  type="ean13"
  renderer="canvas"
  :module-size="3"
  :encode="{ height: 40, quietZone: 12 }"
/>
```

## Barcode Example

```vue
<Lolicode
  content="ABC-123"
  type="code128"
  renderer="svg"
  :module-size="2"
  :encode="{ height: 36, quietZone: 10 }"
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string` | Required | Content to encode. |
| `type` | `EncodableCodeType` | `qrcode` | Code type passed to `@lolicode/core`. |
| `renderer` | `svg \| canvas` | `svg` | Rendering backend. |
| `encode` | `object` | `undefined` | Encoder options for the selected `type`. |
| `moduleSize` | `number` | `4` | Pixel size of each matrix module. |
| `foreground` | `string` | `#000000` | Filled module color. |
| `background` | `string` | `#FFFFFF` | Empty module background. |
| `includeDeclaration` | `boolean` | `false` | Adds XML declaration when using SVG. |
| `ariaLabel` | `string` | Derived from type | Accessible label for the rendered code. |

## Error Handling

Encoding or rendering errors are rendered as an accessible `<output role="alert">`. This keeps invalid demo states visible during interactive editing.

## Types

```ts
import type { LolicodeProps, LolicodeRenderer } from '@lolicode/vue'
```

## License

[MIT](../../LICENSE) License © [hackycy](https://github.com/hackycy)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lolicode/vue?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@lolicode/vue
[npm-downloads-src]: https://img.shields.io/npm/dm/@lolicode/vue?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@lolicode/vue
[license-src]: https://img.shields.io/github/license/hackycy/lolicode.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hackycy/lolicode/blob/main/LICENSE
