# ARCHITECTURE

> 一个将二维码、条形码用数据形式描述点阵的 TypeScript 库

---

## 1. 核心技术栈 (Tech Stack)

| 类别       | 技术选型              | 版本     | 说明                     |
| :------- | :---------------- | :----- | :--------------------- |
| **语言**   | TypeScript        | ^5.9.3+  | 严格模式，完整类型支持            |
| **构建工具** | tsdown              | ^0.16.8+  | 零配置库打包，支持 ESM/CJS 双格式  |
| **任务编排** | Turborepo         | ^2.9+   | Monorepo 构建缓存 + 并行任务     |
| **测试框架** | Vitest            | ^4.1.5+  | 快速单元测试 + 快照测试          |
| **代码规范** | ESLint (@antfu/eslint-config) | latest | 代码质量 + 内置格式化保障      |
| **文档工具** | VitePress         | ^1.0+  | 静态文档站点                 |
| **包管理器** | pnpm              | ^10.0+ | 高效依赖管理，workspace catalog |
| **版本管理** | bumpp             | ^10.4+ | 语义化版本 + Git tag 自动化    |

### 渲染适配器（可选插件）

| 适配器                             | 技术栈           | 说明            |
| :------------------------------ | :------------ | :------------ |
| `@lolicode/renderer-canvas`   | Canvas 2D API | 浏览器 Canvas 渲染 |
| `@lolicode/renderer-svg`      | SVG           | 矢量图渲染         |
| `@lolicode/renderer-terminal` | ANSI Escape   | 终端 ASCII 渲染   |

---

## 2. 项目文件结构 (Project Structure)

```plain
|----------------
├── packages/
│   ├── core/                          # 核心库
│   │   ├── src/
│   │   │   ├── index.ts               # 主入口
│   │   │   ├── types/                 # 类型定义
│   │   │   │   ├── index.ts
│   │   │   │   ├── matrix.ts          # DotMatrix 类型
│   │   │   │   ├── options.ts         # 编码选项类型
│   │   │   │   └── render.ts          # 渲染器接口
│   │   │   ├── encoders/              # 编码器实现
│   │   │   │   ├── base.ts            # 抽象基类
│   │   │   │   ├── qrcode/            # QR Code 实现
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── encoder.ts
│   │   │   │   │   ├── reed-solomon.ts
│   │   │   │   │   └── mask-patterns.ts
│   │   │   │   ├── datamatrix/        # Data Matrix 实现
│   │   │   │   │   └── ...
│   │   │   │   ├── pdf417/            # PDF417 实现
│   │   │   │   │   └── ...
│   │   │   │   ├── barcode/           # 一维码基类
│   │   │   │   │   ├── base.ts
│   │   │   │   │   ├── code128.ts
│   │   │   │   │   ├── code39.ts
│   │   │   │   │   ├── ean13.ts
│   │   │   │   │   └── itf.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/                 # 工具函数
│   │   │   │   ├── bit-matrix.ts      # 位矩阵操作
│   │   │   │   ├── encoding.ts        # 字符编码
│   │   │   │   └── validation.ts      # 输入验证
│   │   │   └── renderers/             # 内置渲染器接口
│   │   │       ├── types.ts
│   │   │       └── base.ts
│   │   ├── test/                      # 测试文件
│   │   │   ├── encoders/
│   │   │   │   ├── qrcode.test.ts
│   │   │   │   └── barcode.test.ts
│   │   │   └── snapshots/             # 快照测试数据
│   │   ├── package.json
│   │   └── tsdown.config.ts
│   │
│   ├── renderer-canvas/               # Canvas 渲染器插件
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── canvas-renderer.ts
│   │   └── package.json
│   │
│   ├── renderer-svg/                  # SVG 渲染器插件
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── svg-renderer.ts
│   │   └── package.json
│   │
│   └── renderer-terminal/             # 终端渲染器插件
│       ├── src/
│       │   ├── index.ts
│       │   └── terminal-renderer.ts
│       └── package.json
│
├── docs/                              # VitePress 文档
│   ├── .vitepress/
│   │   └── config.ts
│   ├── index.md
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── api-reference.md
│   │   └── custom-renderer.md
│   └── examples/
│       └── basic-usage.md
│
├── pnpm-workspace.yaml                # Monorepo 配置（含 catalog）
├── package.json                       # 根 package.json
├── tsconfig.json                      # 基础 tsconfig
├── turbo.json                         # Turborepo 任务编排
├── eslint.config.js                   # ESLint flat config (@antfu/eslint-config)
└── README.md
```

---

## 3. 核心类型设计 (Type Definitions)

### 3.1 点阵数据结构

```typescript
// packages/core/src/types/matrix.ts

/**
 * 单个点的值：0 = 空白, 1 = 填充
 */
export type DotValue = 0 | 1

/**
 * 点阵数据矩阵
 */
export interface DotMatrix {
  /** 二维数组，每个元素为 0 或 1 */
  data: DotValue[][]
  /** 矩阵宽度（列数） */
  width: number
  /** 矩阵高度（行数） */
  height: number
  /** 元数据信息 */
  metadata: DotMatrixMetadata
}

/**
 * 一维条码逻辑符号：每个元素代表一个窄模块，1 = 条，0 = 空
 */
export interface BarcodeSymbol {
  modules: DotValue[]
  width: number
  metadata: DotMatrixMetadata
}

/**
 * 点阵元数据
 */
export interface DotMatrixMetadata {
  /** 码制类型 */
  type: CodeType
  /** 码制族群，用于渲染器选择默认布局策略 */
  family: CodeFamily
  /** QR Code 专用：版本号 (1-40) */
  version?: number
  /** QR Code 专用：纠错等级 */
  errorLevel?: ErrorCorrectionLevel
  /** 条形码专用：编码内容长度 */
  contentLength?: number
  /** 编码时间戳 */
  generatedAt: number
}

/**
 * 支持的码制类型
 */
export type CodeType
  = | 'qrcode'
    | 'qrcode-micro'
    | 'datamatrix'
    | 'pdf417'
    | 'aztec'
    | 'code128'
    | 'code39'
    | 'code93'
    | 'codabar'
    | 'gs1_128'
    | 'msi'
    | 'ean13'
    | 'ean8'
    | 'upca'
    | 'upce'
    | 'itf'

/**
 * 码制族群
 */
export type CodeFamily = 'matrix' | 'linear'

/**
 * QR Code 纠错等级
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
```

### 3.2 编码选项类型

```typescript
// packages/core/src/types/options.ts

/**
 * 基础编码选项
 */
export interface BaseEncodeOptions {
  /** 边距（模块数），默认 4 */
  margin?: number
  /** 是否反转颜色（白底黑点 → 黑底白点） */
  inverted?: boolean
}

/**
 * QR Code 编码选项
 */
export interface QRCodeOptions extends BaseEncodeOptions {
  /** 版本号 (1-40)，不指定则自动选择 */
  version?: number
  /** 纠错等级，默认 'M' */
  errorLevel?: ErrorCorrectionLevel
  /** 掩码模式 (0-7)，不指定则自动选择最优 */
  maskPattern?: number
  /** 编码模式，不指定则自动选择 */
  mode?: 'numeric' | 'alphanumeric' | 'byte' | 'kanji'
}

/**
 * Data Matrix 编码选项
 */
export interface DataMatrixOptions extends BaseEncodeOptions {
  /** 形状：方形或矩形 */
  shape?: 'square' | 'rectangle'
  /** 编码模式 */
  mode?: 'ascii' | 'c40' | 'text' | 'x12' | 'edifact' | 'base256'
}

/**
 * PDF417 编码选项
 */
export interface PDF417Options extends BaseEncodeOptions {
  /** 安全等级 (0-8) */
  securityLevel?: number
  /** 列数 (1-30) */
  columns?: number
  /** 行高 (1-90) */
  rows?: number
  /** 宽高比 */
  aspectRatio?: number
}

/**
 * 一维码编码选项
 */
export interface BarcodeOptions {
  /** 窄模块横向列数，默认 2 */
  moduleWidth?: number
  /** 条码主体高度（行数），默认 24 */
  height?: number
  /** 左右静区宽度（窄模块数），默认 10 */
  quietZone?: number
  /** 上下留白高度（行数），默认 1 */
  verticalMargin?: number
  /** 是否显示文字 */
  showText?: boolean
}

/**
 * EAN/UPC 编码选项
 */
export interface EANOptions extends BarcodeOptions {
  /** 是否包含校验位，默认 true（自动计算） */
  includeChecksum?: boolean
}

/**
 * Code 128 编码选项
 */
export interface Code128Options extends BarcodeOptions {
  /** 编码子集：A/B/C 或自动 */
  subset?: 'A' | 'B' | 'C' | 'auto'
}

/**
 * ITF 编码选项
 */
export interface ITFOptions extends BarcodeOptions {
  /** 宽窄比，默认 2.5 */
  wideToNarrowRatio?: number
}
```

### 3.3 一维码编码流程

一维码编码器分为两层：

1. **逻辑符号层**：码制实现只负责把内容编码为条/空 run-length 序列，并展开为 `BarcodeSymbol.modules`。该序列使用窄模块作为单位，不包含渲染尺寸、静区或上下留白。
2. **矩阵布局层**：`BarcodeEncoder` 基类统一把 `BarcodeSymbol` 布局为 `DotMatrix`。`moduleWidth` 只控制横向模块列数，`height` 只控制条码主体行数，`quietZone` 只控制左右静区，`verticalMargin` 只控制上下留白。

这一分层保证码制算法不依赖终端、SVG、Canvas 等渲染介质，也避免 QR Code 的四边 `margin` 语义污染一维码的左右静区语义。

```typescript
export abstract class BarcodeEncoder extends Encoder<BarcodeOptions> {
  /** 条/空 run-length 序列，从条开始，每个元素为窄模块数 */
  abstract encodeToRuns(content: string): number[]

  /** 生成不含渲染尺寸的一维逻辑符号 */
  encodeSymbol(content: string): BarcodeSymbol

  /** 通过统一布局规则输出 DotMatrix */
  encode(content: string, options?: BarcodeOptions): DotMatrix
}
```

### 3.4 编码器接口

```typescript
// packages/core/src/encoders/base.ts

import type { CodeType, DotMatrix } from '../types'

/**
 * 编码器抽象基类
 */
export abstract class Encoder<TOptions = object> {
  /**
   * 编码内容为点阵数据
   * @param content 要编码的内容
   * @param options 编码选项
   */
  abstract encode(content: string, options?: TOptions): DotMatrix

  /**
   * 验证输入内容是否有效
   * @param content 要验证的内容
   */
  abstract validate(content: string): boolean

  /**
   * 获取该码制支持的内容最大长度
   */
  abstract getMaxLength(): number

  /**
   * 获取码制类型标识
   */
  abstract getType(): CodeType
}
```

### 3.5 渲染器接口

```typescript
// packages/core/src/renderers/types.ts

import type { DotMatrix } from '../types'

/**
 * 渲染器抽象接口
 */
export interface Renderer<TOutput, TOptions = object> {
  /**
   * 将点阵数据渲染为目标格式
   * @param matrix 点阵数据
   * @param options 渲染选项
   */
  render: (matrix: DotMatrix, options?: TOptions) => TOutput

  /**
   * 渲染器名称
   */
  readonly name: string
}

/**
 * 渲染意图：scan 保留可扫描/精确几何，preview 优先适配展示介质
 */
export type RenderIntent = 'scan' | 'preview'

/**
 * 渲染视口约束
 */
export interface RenderViewport {
  maxWidth?: number
  maxHeight?: number
}

/**
 * 所有渲染器共享的基础选项
 */
export interface BaseRenderOptions {
  intent?: RenderIntent
  viewport?: RenderViewport
}

/**
 * Canvas 渲染选项
 */
export interface CanvasRenderOptions extends BaseRenderOptions {
  /** Canvas 元素或 2D Context */
  target: HTMLCanvasElement | CanvasRenderingContext2D
  /** 模块大小（像素），默认 4 */
  moduleSize?: number
  /** 前景色（黑点），默认 '#000000' */
  foreground?: string
  /** 背景色，默认 '#FFFFFF' */
  background?: string
}

/**
 * SVG 渲染选项
 */
export interface SVGRenderOptions extends BaseRenderOptions {
  /** 模块大小（像素），默认 4 */
  moduleSize?: number
  /** 前景色，默认 '#000000' */
  foreground?: string
  /** 背景色，默认 '#FFFFFF' */
  background?: string
  /** 是否添加 XML 声明 */
  includeDeclaration?: boolean
}

/**
 * 终端渲染选项
 */
export interface TerminalRenderOptions extends BaseRenderOptions {
  /** 渲染模式；完整一维条码 DotMatrix 默认 bars，其它矩阵默认 utf8 */
  mode?: 'utf8' | 'ansi' | 'small' | 'bars'
  /** 终端层附加空白边距 */
  margin?: number
  /** 是否反转填充和空白 */
  invert?: boolean
  /** bars 模式输出高度；一维条码 preview 默认 4，scan 默认 6 */
  barHeight?: number
  /** bars 模式最大输出列数；优先使用 viewport.maxWidth */
  maxWidth?: number
}
```

终端渲染器应优先接收完整 `DotMatrix`，以便根据 `metadata.family` 选择合适默认模式。二维码/Data Matrix/Aztec 等二维符号默认使用 `utf8` 半块压缩；一维条码默认使用 `bars`，将纵向重复的条码矩阵投影为固定高度的整块竖条，避免二维码式半块压缩在条码上下留白处生成 `▀`/`▄` 噪声。调用方传入裸 `DotValue[][]` 时，渲染器无法获知码制语义，因此只使用显式 `mode` 或默认 `utf8`。

一维条码的精确宽度可能超过常见终端宽度，终端自动换行会破坏视觉结构。`intent` 是跨渲染器的高层策略：`preview` 允许终端 renderer 根据视口约束压缩为可读预览，默认把一维条码限制到 60 列和 4 行；`scan` 保留矩阵精确几何，不自动压缩。SVG、Canvas、PNG 等像素介质也应复用 `intent` 和 `viewport`，但默认优先保留精确几何。

---

## 4. 主 API 设计

```typescript
// packages/core/src/index.ts

import { Code39Encoder } from './encoders/barcode/code39'
import { Code128Encoder } from './encoders/barcode/code128'
import { EAN13Encoder } from './encoders/barcode/ean13'
import { ITFEncoder } from './encoders/barcode/itf'
import { DataMatrixEncoder } from './encoders/datamatrix'
import { PDF417Encoder } from './encoders/pdf417'
import { QREncoder } from './encoders/qrcode'

// ============ 核心导出 ============

export {
  addMargin,
  Code39Encoder,
  Code128Encoder,
  DataMatrixEncoder,
  EAN13Encoder,
  // 工具函数
  invertMatrix,
  ITFEncoder,

  PDF417Encoder,
  // 编码器
  QREncoder,
  resizeMatrix,
  validateContent,
}

// ============ 类型导出 ============

export type {
  BarcodeOptions,
  BarcodeSymbol,
  // 选项类型
  BaseEncodeOptions,
  CanvasRenderOptions,
  Code128Options,
  CodeType,

  DataMatrixOptions,
  DotMatrix,
  DotMatrixMetadata,
  DotValue,
  EANOptions,
  ErrorCorrectionLevel,
  ITFOptions,
  PDF417Options,

  QRCodeOptions,
  // 渲染器类型
  Renderer,
  SVGRenderOptions,
  TerminalRenderOptions,
}

// ============ 便捷函数 ============

/**
 * 快速生成 QR Code 点阵
 */
export function qr(content: string, options?: QRCodeOptions): DotMatrix {
  return new QREncoder().encode(content, options)
}

/**
 * 快速生成 Data Matrix 点阵
 */
export function dataMatrix(content: string, options?: DataMatrixOptions): DotMatrix {
  return new DataMatrixEncoder().encode(content, options)
}

/**
 * 快速生成 PDF417 点阵
 */
export function pdf417(content: string, options?: PDF417Options): DotMatrix {
  return new PDF417Encoder().encode(content, options)
}

/**
 * 快速生成 Code 128 条形码点阵
 */
export function code128(content: string, options?: Code128Options): DotMatrix {
  return new Code128Encoder().encode(content, options)
}

/**
 * 快速生成 Code 39 条形码点阵
 */
export function code39(content: string, options?: BarcodeOptions): DotMatrix {
  return new Code39Encoder().encode(content, options)
}

/**
 * 快速生成 EAN-13 条形码点阵
 */
export function ean13(content: string, options?: EANOptions): DotMatrix {
  return new EAN13Encoder().encode(content, options)
}

/**
 * 快速生成 ITF 条形码点阵
 */
export function itf(content: string, options?: ITFOptions): DotMatrix {
  return new ITFEncoder().encode(content, options)
}
```

---

## 5. 使用示例

### 5.1 基础使用

```typescript
import { code128, qr } from '@lolicode/core'

// 生成 QR Code 点阵
const qrMatrix = qr('https://example.com', {
  errorLevel: 'H',
  margin: 2,
})

console.log(qrMatrix)
// {
//   data: [[0,0,0,...], [0,1,1,...], ...],
//   width: 25,
//   height: 25,
//   metadata: { type: 'qrcode', family: 'matrix', version: 2, errorLevel: 'H', ... }
// }

// 生成 Code 128 条形码点阵
const barcodeMatrix = code128('123456789', {
  moduleWidth: 2,
  height: 24,
  quietZone: 10,
  verticalMargin: 1,
})
```

### 5.2 自定义渲染

```typescript
import { qr } from '@lolicode/core'
import { CanvasRenderer } from '@lolicode/renderer-canvas'

const matrix = qr('Hello World')
const renderer = new CanvasRenderer()

// 渲染到 Canvas
const canvas = document.getElementById('myCanvas')
renderer.render(matrix, {
  target: canvas,
  moduleSize: 6,
  foreground: '#1a1a1a',
  background: '#ffffff',
})
```

### 5.3 自定义渲染器

```typescript
import type { DotMatrix, Renderer } from '@lolicode/core'

// 实现自定义渲染器：输出为 ASCII Art
class ASCIIRenderer implements Renderer<string> {
  readonly name = 'ascii'

  render(matrix: DotMatrix): string {
    return matrix.data
      .map(row => row.map(cell => cell ? '██' : '  ').join(''))
      .join('\n')
  }
}

// 使用
const matrix = qr('TEST')
const ascii = new ASCIIRenderer().render(matrix)
console.log(ascii)
// ████  ████
// █  █ █  █
// ...
```
