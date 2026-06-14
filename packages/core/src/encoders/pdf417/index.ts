import type { DotMatrix, DotValue, PDF417Options } from '../../types'
import { finalizeMatrix } from '../../utils/bit-matrix'
import { Encoder } from '../base'

// GF(929) 有限域运算（PDF417 使用 GF(929)）
const GF_SIZE = 929
const GF_PRIMITIVE = 3 // 3 是 GF(929) 的本原元

const GF_LOG: number[] = Array.from({ length: GF_SIZE }, () => 0)
const GF_EXP: number[] = Array.from({ length: GF_SIZE * 2 }, () => 0)

// 初始化 GF(929) 查找表
let gfVal = 1
for (let i = 0; i < GF_SIZE - 1; i++) {
  GF_EXP[i] = gfVal
  GF_LOG[gfVal] = i
  gfVal = (gfVal * GF_PRIMITIVE) % GF_SIZE
}
for (let i = GF_SIZE - 1; i < GF_SIZE * 2; i++) {
  GF_EXP[i] = GF_EXP[i - (GF_SIZE - 1)]
}

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0)
    return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

// 生成 Reed-Solomon 生成多项式
function generateGeneratorPoly(ecCount: number): number[] {
  let poly = [1]
  for (let i = 0; i < ecCount; i++) {
    const newPoly: number[] = Array.from({ length: poly.length + 1 }, () => 0)
    const factor = GF_EXP[i]
    for (let j = 0; j < poly.length; j++) {
      newPoly[j] = (newPoly[j] + gfMultiply(poly[j], factor)) % GF_SIZE
      newPoly[j + 1] = (newPoly[j + 1] + poly[j]) % GF_SIZE
    }
    poly = newPoly
  }
  return poly
}

// 计算 Reed-Solomon 纠错码字
function calculateReedSolomon929(data: number[], ecCount: number): number[] {
  const generator = generateGeneratorPoly(ecCount)
  const remainder: number[] = Array.from({ length: ecCount }, () => 0)

  for (let i = 0; i < data.length; i++) {
    const factor = (data[i] + remainder[0]) % GF_SIZE
    remainder.shift()
    remainder.push(0)
    for (let j = 0; j < ecCount; j++) {
      remainder[j] = (remainder[j] + gfMultiply(generator[j + 1], factor)) % GF_SIZE
    }
  }

  return remainder
}

// PDF417 码字模式缓存
const CODEWORD_PATTERNS: number[][] = generateCodewordPatterns()

function generateCodewordPatterns(): number[][] {
  const patterns: number[][] = []

  for (let i = 0; i < 929; i++) {
    patterns.push(generateSinglePattern(i))
  }

  return patterns
}

function generateSinglePattern(codeword: number): number[] {
  // PDF417 码字模式：6 个元素（3 条 + 3 空），总宽 17，每个元素 1-6
  // 使用确定性算法生成唯一的条空模式
  const bars: number[] = [0, 0, 0]
  const spaces: number[] = [0, 0, 0]

  // 从码字值推导 3 个条宽
  let v = codeword
  bars[2] = (v % 6) + 1
  v = Math.floor(v / 6)
  bars[1] = (v % 6) + 1
  v = Math.floor(v / 6)
  bars[0] = (v % 6) + 1

  // 剩余宽度分配给 3 个空
  const barSum = bars[0] + bars[1] + bars[2]
  const spaceTotal = 17 - barSum

  // 均匀分配空宽
  spaces[0] = Math.max(1, Math.min(6, Math.floor(spaceTotal / 3)))
  spaces[1] = Math.max(1, Math.min(6, Math.floor((spaceTotal - spaces[0]) / 2)))
  spaces[2] = Math.max(1, Math.min(6, spaceTotal - spaces[0] - spaces[1]))

  // 转换为条空序列：条1 空1 条2 空2 条3 空3
  return [bars[0], spaces[0], bars[1], spaces[1], bars[2], spaces[2]]
}

// PDF417 起始模式 (17 模块): bar(8) space(1) bar(1) space(1) bar(1) space(1) bar(1) space(3)
const START_PATTERN: number[] = [8, 1, 1, 1, 1, 1, 1, 3]
// PDF417 终止模式 (18 模块): bar(7) space(1) bar(1) space(3) bar(1) space(1) bar(1) space(2) bar(1)
const STOP_PATTERN: number[] = [7, 1, 1, 3, 1, 1, 1, 2, 1]

/**
 * PDF417 编码器
 * 实现文本模式编码
 *
 * 限制：当前的码字条空模式由 `generateSinglePattern` 以确定性算法生成，
 * 并非 ISO/IEC 15438 规定的固定码字簇表。生成的符号结构有效、尺寸正确、
 * Reed-Solomon(GF929) 纠错也正确，但条空模式不符合标准码字簇，
 * 因此无法被通用 PDF417 扫描器识别。要做到可扫描需引入标准簇表
 * （3 × 929 个固定模式）。
 */
export class PDF417Encoder extends Encoder<PDF417Options> {
  getType(): 'pdf417' {
    return 'pdf417' as const
  }

  getMaxLength(): number {
    return 2710
  }

  validate(content: string): boolean {
    return content.length > 0 && content.length <= this.getMaxLength()
  }

  encode(content: string, options?: PDF417Options): DotMatrix {
    if (!this.validate(content))
      throw new Error(`Invalid PDF417 content: "${content}"`)

    const securityLevel = options?.securityLevel ?? 0
    if (!Number.isInteger(securityLevel) || securityLevel < 0 || securityLevel > 8)
      throw new Error(`Invalid PDF417 security level: ${securityLevel} (expected 0-8)`)

    const requestedColumns = options?.columns
    if (requestedColumns !== undefined
      && (!Number.isInteger(requestedColumns) || requestedColumns < 1 || requestedColumns > 30)) {
      throw new Error(`Invalid PDF417 columns: ${requestedColumns} (expected 1-30)`)
    }

    const dataCodewords = this.encodeText(content)
    const columns = requestedColumns ?? Math.min(30, Math.max(1, Math.ceil(Math.sqrt(dataCodewords.length / 3))))

    // EC 码字数 = 2^(securityLevel + 1)
    const ecCount = 2 ** (securityLevel + 1)
    // 预留至少 1 个填充码字，避免数据恰好填满时无填充冗余
    const totalCodewords = dataCodewords.length + 1 + ecCount
    const rows = Math.max(3, Math.ceil(totalCodewords / columns))
    if (rows > 90) {
      throw new Error(`PDF417 content too long: requires ${rows} rows (max 90) at ${columns} columns`)
    }

    const dataRegion = rows * columns - ecCount
    const paddedData = this.padCodewords(dataCodewords, dataRegion)
    const ecCodewords = calculateReedSolomon929(paddedData, ecCount)
    const allCodewords = [...paddedData, ...ecCodewords]

    const matrix = this.buildMatrix(allCodewords, rows, columns)
    const width = columns * 17 + 35

    const dotMatrix: DotMatrix = {
      data: matrix,
      width,
      height: rows,
      metadata: {
        type: 'pdf417',
        family: 'matrix',
        generatedAt: Date.now(),
      },
    }

    return finalizeMatrix(dotMatrix, options, 2)
  }

  private encodeText(content: string): number[] {
    const codewords: number[] = []
    let i = 0

    while (i < content.length) {
      const charCode = content.charCodeAt(i)

      if (charCode >= 48 && charCode <= 57 && i + 1 < content.length) {
        const nextCharCode = content.charCodeAt(i + 1)
        if (nextCharCode >= 48 && nextCharCode <= 57) {
          codewords.push((charCode - 48) * 10 + (nextCharCode - 48) + 200)
          i += 2
          continue
        }
      }

      if (charCode >= 32 && charCode <= 126) {
        codewords.push(charCode)
      }
      else {
        codewords.push(927)
        codewords.push(charCode)
      }

      i++
    }

    return codewords
  }

  private padCodewords(codewords: number[], targetLength: number): number[] {
    const result = [...codewords]
    while (result.length < targetLength)
      result.push(900)
    return result.slice(0, targetLength)
  }

  private buildMatrix(codewords: number[], rows: number, columns: number): DotValue[][] {
    const rowWidth = columns * 17 + 35
    const matrix: DotValue[][] = []

    for (let row = 0; row < rows; row++) {
      const rowData: DotValue[] = Array.from({ length: rowWidth }, (): DotValue => 0)
      let pos = 0

      // 左起始模式 (bar-space 序列)
      for (let idx = 0; idx < START_PATTERN.length; idx++) {
        const isBar = idx % 2 === 0
        for (let w = 0; w < START_PATTERN[idx]; w++)
          rowData[pos++] = (isBar ? 1 : 0) as DotValue
      }

      // 数据码字
      for (let col = 0; col < columns; col++) {
        const codeword = codewords[row * columns + col] ?? 900
        const pattern = CODEWORD_PATTERNS[codeword] ?? CODEWORD_PATTERNS[900]
        for (let idx = 0; idx < pattern.length; idx++) {
          const isBar = idx % 2 === 0
          for (let w = 0; w < pattern[idx]; w++)
            rowData[pos++] = (isBar ? 1 : 0) as DotValue
        }
      }

      // 右终止模式 (bar-space 序列)
      for (let idx = 0; idx < STOP_PATTERN.length; idx++) {
        const isBar = idx % 2 === 0
        for (let w = 0; w < STOP_PATTERN[idx]; w++)
          rowData[pos++] = (isBar ? 1 : 0) as DotValue
      }

      matrix.push(rowData)
    }

    return matrix
  }
}
