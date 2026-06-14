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

### 包职责边界

`@lolicode/core` 是编码引擎层，负责把内容转换为带语义元数据的 `DotMatrix`。渲染器包是用户场景入口，负责把“内容 + 码制 + 渲染目标”编排成最终输出；例如 terminal 用户应能只引入 `@lolicode/renderer-terminal`，用 `renderTerminal('Hello', { type: 'qrcode' })` 完成矩阵码编码和渲染。终端不是可靠的一维条码介质，`@lolicode/renderer-terminal` 不支持 `family: 'linear'` 的条码；一维条码应使用 SVG、Canvas、PNG 等像素/矢量渲染器。只有需要复用点阵、实现自定义渲染器或直接操作矩阵时，才需要直接使用 `@lolicode/core`。

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

/**
 * 可直接编码的码制类型
 */
export type EncodableCodeType = Exclude<CodeType, 'qrcode-micro'>

/**
 * 各码制对应的编码选项
 */
export interface CodeEncodeOptionsMap {
  qrcode: QRCodeOptions
  datamatrix: DataMatrixOptions
  pdf417: PDF417Options
  aztec: BaseEncodeOptions
  code128: Code128Options
  code39: BarcodeOptions
  code93: BarcodeOptions
  codabar: BarcodeOptions
  gs1_128: BarcodeOptions
  msi: BarcodeOptions
  ean13: EANOptions
  ean8: EANOptions
  upca: EANOptions
  upce: EANOptions
  itf: ITFOptions
}

/**
 * 声明式编码请求
 */
export type CodeEncodeRequest<TType extends EncodableCodeType = EncodableCodeType> = {
  [Type in TType]: {
    type: Type
    content: string
    options?: CodeEncodeOptionsMap[Type]
  }
}[TType]
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
 * 所有渲染器共享的基础选项
 */
export interface BaseRenderOptions {}

/**
 * Canvas 渲染选项
 */
export interface CanvasRenderOptions extends BaseRenderOptions {
  /** Canvas 元素或 2D Context（core 层保持跨环境，精确类型由 renderer-canvas 提供） */
  target: unknown
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
  /** 渲染模式，默认 utf8 */
  mode?: 'utf8' | 'ansi' | 'small'
  /** 终端层附加空白边距 */
  margin?: number
  /** 是否反转填充和空白 */
  invert?: boolean
}
```

终端渲染器支持二维码/Data Matrix/PDF417/Aztec 等 `family: 'matrix'` 的二维码，默认使用 `utf8` 半块压缩。终端渲染器不支持 `family: 'linear'` 的一维条码；传入一维条码 `DotMatrix` 或声明式一维条码请求时必须抛出错误，提示调用方使用 SVG、Canvas、PNG 等像素/矢量渲染器。

一维条码的横向模块比例是编码结果的一部分，终端字符、字体、字距、行高和自动换行都不能提供可靠的条码输出介质。终端包不提供条码调试预览、横向压缩或 bars 模式，避免 API 暗示终端可以生成可扫码条码。

面向终端场景的入口接受三类输入：

```typescript
type TerminalCodeType = 'qrcode' | 'datamatrix' | 'pdf417' | 'aztec'
type TerminalInput = DotMatrix | DotValue[][] | CodeEncodeRequest<TerminalCodeType>

type TerminalCodeRenderOptions<TType extends TerminalCodeType = TerminalCodeType>
  = TerminalRenderOptions & {
    type: TType
    encode?: CodeEncodeOptionsMap[TType]
  }

renderTerminal('Hello', { type: 'qrcode' })
renderTerminal({ type: 'qrcode', content: 'LOLI', options: { margin: 1 } })
renderTerminal(prebuiltMatrix)
```

字符串简写和声明式请求由 renderer 包内部调用 core 编码器解析，调用方不需要先构造 `DotMatrix`。已经预编码的 `DotMatrix` 仍然保留完整语义元数据，适合缓存、复用或跨渲染器输出；裸 `DotValue[][]` 只作为低层输入使用。

---

## 4. 主 API 设计

```typescript
// packages/core/src/index.ts

import { AztecEncoder } from './encoders/aztec'
import { CodabarEncoder } from './encoders/barcode/codabar'
import { Code39Encoder } from './encoders/barcode/code39'
import { Code93Encoder } from './encoders/barcode/code93'
import { Code128Encoder } from './encoders/barcode/code128'
import { EAN8Encoder } from './encoders/barcode/ean8'
import { EAN13Encoder } from './encoders/barcode/ean13'
import { GS1_128Encoder } from './encoders/barcode/gs1_128'
import { ITFEncoder } from './encoders/barcode/itf'
import { MSIEncoder } from './encoders/barcode/msi'
import { UPCAEncoder } from './encoders/barcode/upca'
import { UPCEncoder } from './encoders/barcode/upce'
import { DataMatrixEncoder } from './encoders/datamatrix'
import { PDF417Encoder } from './encoders/pdf417'
import { QREncoder } from './encoders/qrcode'

// ============ 核心导出 ============

export {
  AztecEncoder,
  CodabarEncoder,
  Code39Encoder,
  Code93Encoder,
  Code128Encoder,
  DataMatrixEncoder,
  EAN8Encoder,
  EAN13Encoder,
  GS1_128Encoder,
  ITFEncoder,
  MSIEncoder,
  PDF417Encoder,
  QREncoder,
  UPCAEncoder,
  UPCEncoder,
} from './encoders'

export { BarcodeEncoder } from './encoders/barcode/base'
export { Encoder } from './encoders/base'
export { BaseRenderer } from './renderers/base'
export { addMargin, invertMatrix, resizeMatrix, validateContent } from './utils/bit-matrix'

// ============ 类型导出 ============

export type {
  BarcodeOptions,
  BarcodeSymbol,
  // 选项类型
  BaseEncodeOptions,
  BaseRenderOptions,
  CanvasRenderOptions,
  Code128Options,
  CodeEncodeOptionsMap,
  CodeEncodeRequest,
  CodeFamily,
  CodeType,

  DataMatrixOptions,
  DotMatrix,
  DotMatrixMetadata,
  DotValue,
  EANOptions,
  EncodableCodeType,
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
 * 快速生成 EAN-8 条形码点阵
 */
export function ean8(content: string, options?: EANOptions): DotMatrix

/**
 * 快速生成 UPC-A 条形码点阵
 */
export function upca(content: string, options?: EANOptions): DotMatrix

/**
 * 快速生成 UPC-E 条形码点阵
 */
export function upce(content: string, options?: EANOptions): DotMatrix

/**
 * 快速生成 ITF 条形码点阵
 */
export function itf(content: string, options?: ITFOptions): DotMatrix {
  return new ITFEncoder().encode(content, options)
}

/**
 * 快速生成 Code 93 条形码点阵
 */
export function code93(content: string, options?: BarcodeOptions): DotMatrix

/**
 * 快速生成 Codabar 条形码点阵
 */
export function codabar(content: string, options?: BarcodeOptions): DotMatrix

/**
 * 快速生成 MSI Plessey 条形码点阵
 */
export function msi(content: string, options?: BarcodeOptions): DotMatrix

/**
 * 快速生成 GS1-128 条形码点阵
 */
export function gs1_128(content: string, options?: BarcodeOptions): DotMatrix

/**
 * 快速生成 Aztec Code 点阵
 */
export function aztec(content: string, options?: BaseEncodeOptions): DotMatrix

/**
 * 根据声明式请求生成点阵
 */
export function encode(request: CodeEncodeRequest): DotMatrix {
  // 根据 request.type 分发到 qrcode/datamatrix/pdf417/aztec
  // 以及 code128/code39/code93/codabar/gs1_128/msi/ean13/ean8/upca/upce/itf
}
```

---

## 5. 使用示例

### 5.1 终端使用

```typescript
import { renderTerminal } from '@lolicode/renderer-terminal'

console.log(renderTerminal('https://example.com', {
  type: 'qrcode',
  encode: { errorLevel: 'H', margin: 2 },
}))
```

### 5.2 点阵复用

```typescript
import { encode } from '@lolicode/core'
import { renderTerminal } from '@lolicode/renderer-terminal'

const matrix = encode({
  type: 'qrcode',
  content: 'https://example.com',
  options: { errorLevel: 'H', margin: 2 },
})

console.log(matrix)
// {
//   data: [[0,0,0,...], [0,1,1,...], ...],
//   width: 25,
//   height: 25,
//   metadata: { type: 'qrcode', family: 'matrix', version: 2, errorLevel: 'H', ... }
// }

console.log(renderTerminal(matrix))
```

### 5.3 自定义渲染

```typescript
import { encode } from '@lolicode/core'
import { CanvasRenderer } from '@lolicode/renderer-canvas'

const matrix = encode({ type: 'qrcode', content: 'Hello World' })
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

### 5.4 自定义渲染器

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
