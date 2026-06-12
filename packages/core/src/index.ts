import type {
  BarcodeOptions,
  BaseEncodeOptions,
  Code128Options,
  CodeEncodeRequest,
  DataMatrixOptions,
  DotMatrix,
  EANOptions,
  ITFOptions,
  PDF417Options,
  QRCodeOptions,
} from './types'
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
  // 点阵类型
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
  RenderIntent,
  RenderViewport,
  SVGRenderOptions,
  TerminalRenderOptions,
} from './types'

// ============ 类型导出 ============

export {
  addMargin,
  invertMatrix,
  resizeMatrix,
  validateContent,
} from './utils/bit-matrix'

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

/**
 * 快速生成 EAN-8 条形码点阵
 */
export function ean8(content: string, options?: EANOptions): DotMatrix {
  return new EAN8Encoder().encode(content, options)
}

/**
 * 快速生成 UPC-A 条形码点阵
 */
export function upca(content: string, options?: EANOptions): DotMatrix {
  return new UPCAEncoder().encode(content, options)
}

/**
 * 快速生成 UPC-E 条形码点阵
 */
export function upce(content: string, options?: EANOptions): DotMatrix {
  return new UPCEncoder().encode(content, options)
}

/**
 * 快速生成 Code 93 条形码点阵
 */
export function code93(content: string, options?: BarcodeOptions): DotMatrix {
  return new Code93Encoder().encode(content, options)
}

/**
 * 快速生成 Codabar 条形码点阵
 */
export function codabar(content: string, options?: BarcodeOptions): DotMatrix {
  return new CodabarEncoder().encode(content, options)
}

/**
 * 快速生成 MSI Plessey 条形码点阵
 */
export function msi(content: string, options?: BarcodeOptions): DotMatrix {
  return new MSIEncoder().encode(content, options)
}

/**
 * 快速生成 GS1-128 条形码点阵
 */
export function gs1_128(content: string, options?: BarcodeOptions): DotMatrix {
  return new GS1_128Encoder().encode(content, options)
}

/**
 * 快速生成 Aztec Code 点阵
 */
export function aztec(content: string, options?: BaseEncodeOptions): DotMatrix {
  return new AztecEncoder().encode(content, options)
}

/**
 * 根据声明式请求生成点阵
 */
export function encode(request: CodeEncodeRequest): DotMatrix {
  switch (request.type) {
    case 'qrcode':
      return qr(request.content, request.options)
    case 'datamatrix':
      return dataMatrix(request.content, request.options)
    case 'pdf417':
      return pdf417(request.content, request.options)
    case 'aztec':
      return aztec(request.content, request.options)
    case 'code128':
      return code128(request.content, request.options)
    case 'code39':
      return code39(request.content, request.options)
    case 'code93':
      return code93(request.content, request.options)
    case 'codabar':
      return codabar(request.content, request.options)
    case 'gs1_128':
      return gs1_128(request.content, request.options)
    case 'msi':
      return msi(request.content, request.options)
    case 'ean13':
      return ean13(request.content, request.options)
    case 'ean8':
      return ean8(request.content, request.options)
    case 'upca':
      return upca(request.content, request.options)
    case 'upce':
      return upce(request.content, request.options)
    case 'itf':
      return itf(request.content, request.options)
    default:
      throw new Error(`Unsupported code type: ${(request as { type: string }).type}`)
  }
}
