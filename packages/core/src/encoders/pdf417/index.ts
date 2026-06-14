import type { DotMatrix, PDF417Options } from '../../types'
import { addMargin, invertMatrix } from '../../utils/bit-matrix'
import { canEncodeWithBwip, getBwipMatrix } from '../../utils/bwip'
import { Encoder } from '../base'

function normalizeOptions(options?: PDF417Options): Record<string, number> {
  if ((options as { aspectRatio?: unknown } | undefined)?.aspectRatio !== undefined)
    throw new Error('PDF417 aspectRatio option is not supported')

  const normalized: Record<string, number> = {}

  if (options?.securityLevel !== undefined) {
    if (!Number.isInteger(options.securityLevel) || options.securityLevel < 0 || options.securityLevel > 8)
      throw new Error(`Invalid PDF417 securityLevel: ${options.securityLevel}`)
    normalized.eclevel = options.securityLevel
  }

  if (options?.columns !== undefined) {
    if (!Number.isInteger(options.columns) || options.columns < 1 || options.columns > 30)
      throw new Error(`Invalid PDF417 columns: ${options.columns}`)
    normalized.columns = options.columns
  }

  if (options?.rows !== undefined) {
    if (!Number.isInteger(options.rows) || options.rows < 1 || options.rows > 90)
      throw new Error(`Invalid PDF417 rows: ${options.rows}`)
    normalized.rows = options.rows
  }

  return normalized
}

/**
 * PDF417 encoder.
 */
export class PDF417Encoder extends Encoder<PDF417Options> {
  getType(): 'pdf417' {
    return 'pdf417' as const
  }

  getMaxLength(): number {
    return 2710
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength() && canEncodeWithBwip('pdf417', content)
  }

  encode(content: string, options?: PDF417Options): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid PDF417 content: "${content}"`)

    const matrix = getBwipMatrix('pdf417', content, normalizeOptions(options))
    let dotMatrix: DotMatrix = {
      data: matrix,
      width: matrix[0]?.length ?? 0,
      height: matrix.length,
      metadata: {
        type: 'pdf417',
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
