import type { BaseEncodeOptions, CodeType, DotMatrix } from '../../types'
import { addMargin, invertMatrix } from '../../utils/bit-matrix'
import { canEncodeWithBwip, getBwipMatrix } from '../../utils/bwip'
import { Encoder } from '../base'

/**
 * Aztec Code encoder.
 */
export class AztecEncoder extends Encoder<BaseEncodeOptions> {
  getType(): CodeType {
    return 'aztec'
  }

  getMaxLength(): number {
    return 3832
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength() && canEncodeWithBwip('azteccode', content)
  }

  encode(content: string, options?: BaseEncodeOptions): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid Aztec content: ${content}`)

    const matrix = getBwipMatrix('azteccode', content)
    let dotMatrix: DotMatrix = {
      data: matrix,
      width: matrix[0]?.length ?? 0,
      height: matrix.length,
      metadata: {
        type: 'aztec',
        family: 'matrix',
        contentLength: content.length,
        generatedAt: Date.now(),
      },
    }

    const margin = options?.margin ?? 2
    if (margin > 0)
      dotMatrix = addMargin(dotMatrix, margin)
    return options?.inverted === true ? invertMatrix(dotMatrix) : dotMatrix
  }
}
