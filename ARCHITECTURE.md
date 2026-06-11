# ARCHITECTURE

> 一个将二维码、条形码用数据形式描述点阵的 TypeScript 库

---

## 1. 核心技术栈 (Tech Stack)

| 类别       | 技术选型              | 版本     | 说明                     |
| :------- | :---------------- | :----- | :--------------------- |
| **语言**   | TypeScript        | ^5.3+  | 严格模式，完整类型支持            |
| **构建工具** | tsdown              | ^0.16.8+  | 零配置库打包，支持 ESM/CJS 双格式  |
| **测试框架** | Vitest            | ^4.1.5+  | 快速单元测试 + 快照测试          |
| **代码规范** | ESLint + Prettier | latest | 代码质量保障                 |
| **文档工具** | VitePress         | ^1.0+  | 静态文档站点                 |
| **包管理器** | pnpm              | ^8.0+  | 高效依赖管理                 |
| **版本管理** | changesets        | ^2.27+ | 语义化版本 + Changelog 自动生成 |

### 渲染适配器（可选插件）

| 适配器                             | 技术栈           | 说明            |
| :------------------------------ | :------------ | :------------ |
| `@lolicode/renderer-canvas`   | Canvas 2D API | 浏览器 Canvas 渲染 |
| `@lolicode/renderer-svg`      | SVG           | 矢量图渲染         |
| `@lolicode/renderer-terminal` | ANSI Escape   | 终端 ASCII 渲染   |

---

## 2. 环境变量规范 (.env.example)

```bash
# 构建配置（可选）
NODE_ENV=development

# NPM 发布配置（CI/CD 使用）
NPM_TOKEN=npm_xxxxx

# 文档部署（可选）
GITHUB_TOKEN=ghp_xxxxx
```

---

## 3. 项目文件结构 (Project Structure)

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
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
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
├── pnpm-workspace.yaml                # Monorepo 配置
├── package.json                       # 根 package.json
├── tsconfig.json                      # 基础 tsconfig
├── .eslintrc.js
├── .prettierrc
├── .changeset/
│   └── config.json
└── README.md
```

---

## 4. 核心类型设计 (Type Definitions)

### 4.1 点阵数据结构

```typescript
// packages/core/src/types/matrix.ts

/**
 * 单个点的值：0 = 空白, 1 = 填充
 */
export type DotValue = 0 | 1;

/**
 * 点阵数据矩阵
 */
export interface DotMatrix {
  /** 二维数组，每个元素为 0 或 1 */
  data: DotValue[][];
  /** 矩阵宽度（列数） */
  width: number;
  /** 矩阵高度（行数） */
  height: number;
  /** 元数据信息 */
  metadata: DotMatrixMetadata;
}

/**
 * 点阵元数据
 */
export interface DotMatrixMetadata {
  /** 码制类型 */
  type: CodeType;
  /** QR Code 专用：版本号 (1-40) */
  version?: number;
  /** QR Code 专用：纠错等级 */
  errorLevel?: ErrorCorrectionLevel;
  /** 条形码专用：编码内容长度 */
  contentLength?: number;
  /** 编码时间戳 */
  generatedAt: number;
}

/**
 * 支持的码制类型
 */
export type CodeType = 
  | 'qrcode' 
  | 'qrcode-micro'
  | 'datamatrix' 
  | 'pdf417'
  | 'code128'
  | 'code39'
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'upce'
  | 'itf';

/**
 * QR Code 纠错等级
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
```

### 4.2 编码选项类型

```typescript
// packages/core/src/types/options.ts

/**
 * 基础编码选项
 */
export interface BaseEncodeOptions {
  /** 边距（模块数），默认 4 */
  margin?: number;
  /** 是否反转颜色（白底黑点 → 黑底白点） */
  inverted?: boolean;
}

/**
 * QR Code 编码选项
 */
export interface QRCodeOptions extends BaseEncodeOptions {
  /** 版本号 (1-40)，不指定则自动选择 */
  version?: number;
  /** 纠错等级，默认 'M' */
  errorLevel?: ErrorCorrectionLevel;
  /** 掩码模式 (0-7)，不指定则自动选择最优 */
  maskPattern?: number;
  /** 编码模式，不指定则自动选择 */
  mode?: 'numeric' | 'alphanumeric' | 'byte' | 'kanji';
}

/**
 * Data Matrix 编码选项
 */
export interface DataMatrixOptions extends BaseEncodeOptions {
  /** 形状：方形或矩形 */
  shape?: 'square' | 'rectangle';
  /** 编码模式 */
  mode?: 'ascii' | 'c40' | 'text' | 'x12' | 'edifact' | 'base256';
}

/**
 * PDF417 编码选项
 */
export interface PDF417Options extends BaseEncodeOptions {
  /** 安全等级 (0-8) */
  securityLevel?: number;
  /** 列数 (1-30) */
  columns?: number;
  /** 行高 (1-90) */
  rows?: number;
  /** 宽高比 */
  aspectRatio?: number;
}

/**
 * 一维码编码选项
 */
export interface BarcodeOptions extends BaseEncodeOptions {
  /** 条宽（窄条的单位宽度），默认 2 */
  moduleWidth?: number;
  /** 条高，默认 100 */
  height?: number;
  /** 是否显示文字 */
  showText?: boolean;
}

/**
 * EAN/UPC 编码选项
 */
export interface EANOptions extends BarcodeOptions {
  /** 是否包含校验位，默认 true（自动计算） */
  includeChecksum?: boolean;
}

/**
 * Code 128 编码选项
 */
export interface Code128Options extends BarcodeOptions {
  /** 编码子集：A/B/C 或自动 */
  subset?: 'A' | 'B' | 'C' | 'auto';
}

/**
 * ITF 编码选项
 */
export interface ITFOptions extends BarcodeOptions {
  /** 宽窄比，默认 2.5 */
  wideToNarrowRatio?: number;
}
```

### 4.3 编码器接口

```typescript
// packages/core/src/encoders/base.ts

import type { DotMatrix, BaseEncodeOptions } from '../types';

/**
 * 编码器抽象基类
 */
export abstract class Encoder<TOptions extends BaseEncodeOptions> {
  /**
   * 编码内容为点阵数据
   * @param content 要编码的内容
   * @param options 编码选项
   */
  abstract encode(content: string, options?: TOptions): DotMatrix;

  /**
   * 验证输入内容是否有效
   * @param content 要验证的内容
   */
  abstract validate(content: string): boolean;

  /**
   * 获取该码制支持的内容最大长度
   */
  abstract getMaxLength(): number;

  /**
   * 获取码制类型标识
   */
  abstract getType(): CodeType;
}
```

### 4.4 渲染器接口

```typescript
// packages/core/src/renderers/types.ts

import type { DotMatrix } from '../types';

/**
 * 渲染器抽象接口
 */
export interface Renderer<TOutput, TOptions = {}> {
  /**
   * 将点阵数据渲染为目标格式
   * @param matrix 点阵数据
   * @param options 渲染选项
   */
  render(matrix: DotMatrix, options?: TOptions): TOutput;
  
  /**
   * 渲染器名称
   */
  readonly name: string;
}

/**
 * Canvas 渲染选项
 */
export interface CanvasRenderOptions {
  /** Canvas 元素或 2D Context */
  target: HTMLCanvasElement | CanvasRenderingContext2D;
  /** 模块大小（像素），默认 4 */
  moduleSize?: number;
  /** 前景色（黑点），默认 '#000000' */
  foreground?: string;
  /** 背景色，默认 '#FFFFFF' */
  background?: string;
}

/**
 * SVG 渲染选项
 */
export interface SVGRenderOptions {
  /** 模块大小（像素），默认 4 */
  moduleSize?: number;
  /** 前景色，默认 '#000000' */
  foreground?: string;
  /** 背景色，默认 '#FFFFFF' */
  background?: string;
  /** 是否添加 XML 声明 */
  includeDeclaration?: boolean;
}

/**
 * 终端渲染选项
 */
export interface TerminalRenderOptions {
  /** 空白字符，默认 '  '（两个空格） */
  emptyChar?: string;
  /** 填充字符，默认 '██' */
  filledChar?: string;
  /** 是否使用颜色 */
  useColor?: boolean;
}
```

---

## 5. 主 API 设计

```typescript
// packages/core/src/index.ts

import { QREncoder } from './encoders/qrcode';
import { DataMatrixEncoder } from './encoders/datamatrix';
import { PDF417Encoder } from './encoders/pdf417';
import { Code128Encoder } from './encoders/barcode/code128';
import { Code39Encoder } from './encoders/barcode/code39';
import { EAN13Encoder } from './encoders/barcode/ean13';
import { ITFEncoder } from './encoders/barcode/itf';

// ============ 核心导出 ============

export {
  // 编码器
  QREncoder,
  DataMatrixEncoder,
  PDF417Encoder,
  Code128Encoder,
  Code39Encoder,
  EAN13Encoder,
  ITFEncoder,
  
  // 工具函数
  invertMatrix,
  addMargin,
  resizeMatrix,
  validateContent,
};

// ============ 类型导出 ============

export type {
  DotMatrix,
  DotValue,
  DotMatrixMetadata,
  CodeType,
  ErrorCorrectionLevel,
  
  // 选项类型
  BaseEncodeOptions,
  QRCodeOptions,
  DataMatrixOptions,
  PDF417Options,
  BarcodeOptions,
  EANOptions,
  Code128Options,
  ITFOptions,
  
  // 渲染器类型
  Renderer,
  CanvasRenderOptions,
  SVGRenderOptions,
  TerminalRenderOptions,
};

// ============ 便捷函数 ============

/**
 * 快速生成 QR Code 点阵
 */
export function qr(content: string, options?: QRCodeOptions): DotMatrix {
  return new QREncoder().encode(content, options);
}

/**
 * 快速生成 Data Matrix 点阵
 */
export function dataMatrix(content: string, options?: DataMatrixOptions): DotMatrix {
  return new DataMatrixEncoder().encode(content, options);
}

/**
 * 快速生成 PDF417 点阵
 */
export function pdf417(content: string, options?: PDF417Options): DotMatrix {
  return new PDF417Encoder().encode(content, options);
}

/**
 * 快速生成 Code 128 条形码点阵
 */
export function code128(content: string, options?: Code128Options): DotMatrix {
  return new Code128Encoder().encode(content, options);
}

/**
 * 快速生成 Code 39 条形码点阵
 */
export function code39(content: string, options?: Code39Options): DotMatrix {
  return new Code39Encoder().encode(content, options);
}

/**
 * 快速生成 EAN-13 条形码点阵
 */
export function ean13(content: string, options?: EANOptions): DotMatrix {
  return new EAN13Encoder().encode(content, options);
}

/**
 * 快速生成 ITF 条形码点阵
 */
export function itf(content: string, options?: ITFOptions): DotMatrix {
  return new ITFEncoder().encode(content, options);
}
```

---

## 6. 使用示例

### 6.1 基础使用

```typescript
import { qr, code128 } from 'dot-matrix-core';

// 生成 QR Code 点阵
const qrMatrix = qr('https://example.com', {
  errorLevel: 'H',
  margin: 2,
});

console.log(qrMatrix);
// {
//   data: [[0,0,0,...], [0,1,1,...], ...],
//   width: 25,
//   height: 25,
//   metadata: { type: 'qrcode', version: 2, errorLevel: 'H', ... }
// }

// 生成 Code 128 条形码点阵
const barcodeMatrix = code128('123456789', {
  height: 50,
  moduleWidth: 2,
});
```

### 6.2 自定义渲染

```typescript
import { qr } from 'dot-matrix-core';
import { CanvasRenderer } from '@dot-matrix/renderer-canvas';

const matrix = qr('Hello World');
const renderer = new CanvasRenderer();

// 渲染到 Canvas
const canvas = document.getElementById('myCanvas');
renderer.render(matrix, {
  target: canvas,
  moduleSize: 6,
  foreground: '#1a1a1a',
  background: '#ffffff',
});
```

### 6.3 自定义渲染器

```typescript
import type { Renderer, DotMatrix } from 'dot-matrix-core';

// 实现自定义渲染器：输出为 ASCII Art
class ASCIIRenderer implements Renderer<string> {
  readonly name = 'ascii';
  
  render(matrix: DotMatrix): string {
    return matrix.data
      .map(row => row.map(cell => cell ? '██' : '  ').join(''))
      .join('\n');
  }
}

// 使用
const matrix = qr('TEST');
const ascii = new ASCIIRenderer().render(matrix);
console.log(ascii);
// ████  ████
// █  █ █  █
// ...
```
