import type { DataMatrixOptions, DotMatrix } from '../../types'
import { addMargin, invertMatrix } from '../../utils/bit-matrix'
import { canEncodeWithBwip, getBwipMatrix } from '../../utils/bwip'
import { Encoder } from '../base'

function getBcid(options?: DataMatrixOptions): string {
  switch (options?.shape) {
    case undefined:
    case 'square':
      return 'datamatrix'
    case 'rectangle':
      return 'datamatrixrectangular'
    default:
      throw new Error(`Invalid Data Matrix shape: ${options?.shape}`)
  }
}

function assertSupportedOptions(options?: DataMatrixOptions): void {
  const mode = (options as { mode?: unknown } | undefined)?.mode
  if (mode !== undefined)
    throw new Error(`Unsupported Data Matrix mode: ${String(mode)}`)
}

/**
 * Data Matrix ECC200 encoder.
 */
export class DataMatrixEncoder extends Encoder<DataMatrixOptions> {
  getType(): 'datamatrix' {
    return 'datamatrix' as const
  }

  getMaxLength(): number {
    return 1558
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength() && canEncodeWithBwip('datamatrix', content)
  }

  encode(content: string, options?: DataMatrixOptions): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid Data Matrix content: "${content}"`)

    assertSupportedOptions(options)

    const matrix = getBwipMatrix(getBcid(options), content)
    let dotMatrix: DotMatrix = {
      data: matrix,
      width: matrix[0]?.length ?? 0,
      height: matrix.length,
      metadata: {
        type: 'datamatrix',
        family: 'matrix',
        contentLength: content.length,
        generatedAt: Date.now(),
      },
    }

    const margin = options?.margin ?? 0
    if (margin > 0)
      dotMatrix = addMargin(dotMatrix, margin)
    return options?.inverted === true ? invertMatrix(dotMatrix) : dotMatrix
  }
}
