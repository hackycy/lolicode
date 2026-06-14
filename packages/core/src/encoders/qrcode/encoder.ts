import type {
  BitMatrix,
} from '@zxing/library'
import type { DotMatrix, DotValue, ErrorCorrectionLevel, QRCodeOptions } from '../../types'
import {
  BarcodeFormat,
  EncodeHintType,
  QRCodeDecoderErrorCorrectionLevel,
  QRCodeWriter,
} from '@zxing/library'
import { addMargin, invertMatrix } from '../../utils/bit-matrix'
import { isAlphanumeric, isNumeric } from '../../utils/encoding'
import { Encoder } from '../base'

const ERROR_LEVELS: Record<ErrorCorrectionLevel, typeof QRCodeDecoderErrorCorrectionLevel.L> = {
  L: QRCodeDecoderErrorCorrectionLevel.L,
  M: QRCodeDecoderErrorCorrectionLevel.M,
  Q: QRCodeDecoderErrorCorrectionLevel.Q,
  H: QRCodeDecoderErrorCorrectionLevel.H,
}

/**
 * QR Code encoder.
 */
export class QREncoder extends Encoder<QRCodeOptions> {
  getType(): 'qrcode' {
    return 'qrcode' as const
  }

  getMaxLength(): number {
    return 2953
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength()
  }

  encode(content: string, options?: QRCodeOptions): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid QR Code content: "${content.substring(0, 50)}..."`)

    const errorLevel = options?.errorLevel ?? 'M'
    const zxingErrorLevel = ERROR_LEVELS[errorLevel]
    if (zxingErrorLevel === undefined)
      throw new Error(`Invalid QR error level: ${errorLevel}`)

    if (options?.version !== undefined && (!Number.isInteger(options.version) || options.version < 1 || options.version > 40))
      throw new Error(`Invalid QR version: ${options.version}`)

    if ((options as { maskPattern?: unknown } | undefined)?.maskPattern !== undefined)
      throw new Error('QR maskPattern option is not supported')

    const mode = options?.mode ?? this.detectMode(content)
    this.validateModeContent(content, mode)

    const hints = new Map<EncodeHintType, unknown>([
      [EncodeHintType.ERROR_CORRECTION, zxingErrorLevel],
      [EncodeHintType.MARGIN, 0],
    ])
    if (options?.version !== undefined)
      hints.set(EncodeHintType.QR_VERSION, options.version)

    let bitMatrix: BitMatrix
    try {
      bitMatrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 0, 0, hints)
    }
    catch (error) {
      throw new Error(`Data too long for QR Code: ${error instanceof Error ? error.message : String(error)}`)
    }

    const matrix = this.toDotMatrixData(bitMatrix)
    let dotMatrix: DotMatrix = {
      data: matrix,
      width: bitMatrix.getWidth(),
      height: bitMatrix.getHeight(),
      metadata: {
        type: 'qrcode',
        family: 'matrix',
        version: (bitMatrix.getWidth() - 17) / 4,
        errorLevel,
        generatedAt: Date.now(),
      },
    }

    const margin = options?.margin ?? 4
    if (margin > 0)
      dotMatrix = addMargin(dotMatrix, margin)
    return options?.inverted === true ? invertMatrix(dotMatrix) : dotMatrix
  }

  private detectMode(content: string): 'numeric' | 'alphanumeric' | 'byte' {
    if (isNumeric(content))
      return 'numeric'
    if (isAlphanumeric(content))
      return 'alphanumeric'
    return 'byte'
  }

  private validateModeContent(content: string, mode: string): void {
    switch (mode) {
      case 'numeric':
        if (!isNumeric(content))
          throw new Error('QR numeric mode only supports digits')
        return
      case 'alphanumeric':
        if (!isAlphanumeric(content))
          throw new Error('QR alphanumeric mode contains unsupported characters')
        return
      case 'byte':
        return
      default:
        throw new Error(`Invalid QR mode: ${mode}`)
    }
  }

  private toDotMatrixData(bitMatrix: BitMatrix): DotValue[][] {
    const data: DotValue[][] = []
    for (let row = 0; row < bitMatrix.getHeight(); row++) {
      const outRow: DotValue[] = []
      for (let col = 0; col < bitMatrix.getWidth(); col++)
        outRow.push(bitMatrix.get(col, row) ? 1 : 0)
      data.push(outRow)
    }
    return data
  }
}
