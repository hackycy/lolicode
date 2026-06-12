import type { DotMatrix, DotValue, PDF417Options } from '../../types'
import { Encoder } from '../base'

// PDF417 符号字符表（每个码字对应的条空模式，17个模块宽）
// 每个模式由 6 个条空组成，总宽 17
const CODEWORD_PATTERNS: number[][] = generateCodewordPatterns()

function generateCodewordPatterns(): number[][] {
  // PDF417 使用 (17, 4, 2) 条码规则
  // 每个码字有 6 个元素（3条+3空），总宽 17，每个元素宽度 1-6
  const patterns: number[][] = []

  // 生成 929 个码字模式（简化版本）
  for (let i = 0; i < 929; i++) {
    const pattern: number[] = Array.from({ length: 17 }, () => 0)
    // 简化：使用交替模式
    const pos = i % 17
    pattern[pos] = 1
    pattern[(pos + 3) % 17] = 1
    pattern[(pos + 6) % 17] = 1
    pattern[(pos + 9) % 17] = 1
    pattern[(pos + 12) % 17] = 1
    pattern[(pos + 15) % 17] = 1
    patterns.push(pattern)
  }

  return patterns
}

// PDF417 纠错多项式系数
const EC_COEFFICIENTS: number[][] = [
  [], // 0 个 EC 码字
  [1], // 1 个 EC 码字
  [1, 1], // 2 个 EC 码字
  [1, 2, 1], // 3 个 EC 码字
  [1, 3, 3, 1], // 4 个 EC 码字
  [1, 4, 6, 4, 1], // 5 个 EC 码字
  [1, 5, 10, 10, 5, 1], // 6 个 EC 码字
  [1, 6, 15, 20, 15, 6, 1], // 7 个 EC 码字
  [1, 7, 21, 35, 35, 21, 7, 1], // 8 个 EC 码字
]

/**
 * PDF417 编码器
 *
 * 实现文本模式编码（最常用的模式）
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
    if (!this.validate(content)) {
      throw new Error(`Invalid PDF417 content: "${content}"`)
    }

    const securityLevel = options?.securityLevel ?? 0
    const requestedColumns = options?.columns

    // 编码数据为码字
    const dataCodewords = this.encodeText(content)

    // 计算列数
    const columns = requestedColumns ?? Math.min(30, Math.ceil(Math.sqrt(dataCodewords.length / 3)))

    // 计算行数
    const ecCount = securityLevel + 1
    const totalCodewords = dataCodewords.length + ecCount
    const rows = Math.ceil(totalCodewords / columns)

    // 确保行数在有效范围内
    const actualRows = Math.max(3, Math.min(90, rows))

    // 填充数据码字
    const paddedData = this.padCodewords(dataCodewords, actualRows * columns - ecCount)

    // 计算纠错码字
    const ecCodewords = this.calculateEC(paddedData, securityLevel)

    // 合并所有码字
    const allCodewords = [...paddedData, ...ecCodewords]

    // 填充到完整矩阵大小
    while (allCodewords.length < actualRows * columns) {
      allCodewords.push(900) // 填充码字
    }

    // 构建矩阵
    const matrix = this.buildMatrix(allCodewords, actualRows, columns, securityLevel)

    const width = columns * 17 + 35 // 左起始(17) + 数据(columns * 17) + 右终止(18)

    return {
      data: matrix,
      width,
      height: actualRows,
      metadata: {
        type: 'pdf417',
        generatedAt: Date.now(),
      },
    }
  }

  private encodeText(content: string): number[] {
    const codewords: number[] = []
    let i = 0

    while (i < content.length) {
      const charCode = content.charCodeAt(i)

      if (charCode >= 48 && charCode <= 57 && i + 1 < content.length) {
        const nextCharCode = content.charCodeAt(i + 1)
        if (nextCharCode >= 48 && nextCharCode <= 57) {
          // 数字对编码
          const num = (charCode - 48) * 10 + (nextCharCode - 48)
          codewords.push(num + 200)
          i += 2
          continue
        }
      }

      // 文本模式编码
      if (charCode >= 32 && charCode <= 126) {
        codewords.push(charCode)
      }
      else {
        // 扩展字符
        codewords.push(927) // 切换到字节模式
        codewords.push(charCode)
      }

      i++
    }

    return codewords
  }

  private padCodewords(codewords: number[], targetLength: number): number[] {
    const result = [...codewords]
    while (result.length < targetLength) {
      result.push(900) // 填充码字
    }
    return result.slice(0, targetLength)
  }

  private calculateEC(data: number[], securityLevel: number): number[] {
    if (securityLevel === 0) {
      return []
    }

    const ecCount = securityLevel + 1
    const coefficients = EC_COEFFICIENTS[ecCount] || EC_COEFFICIENTS[8]

    // 简化的 Reed-Solomon 计算
    const ec: number[] = Array.from({ length: ecCount }, () => 0)

    for (let i = 0; i < data.length; i++) {
      const factor = data[i]
      for (let j = ec.length - 1; j > 0; j--) {
        ec[j] = (ec[j] + ec[j - 1] * coefficients[j]) % 929
      }
      ec[0] = (ec[0] + factor * coefficients[0]) % 929
    }

    return ec.reverse()
  }

  private buildMatrix(
    codewords: number[],
    rows: number,
    columns: number,
    securityLevel: number,
  ): DotValue[][] {
    // 每行宽度 = 左起始(17) + 数据(columns * 17) + 右终止(18) = 35 + columns * 17
    const rowWidth = columns * 17 + 35
    const matrix: DotValue[][] = []

    for (let row = 0; row < rows; row++) {
      const rowData: DotValue[] = Array.from({ length: rowWidth }, (): DotValue => 0)
      let pos = 0

      // 左起始码字
      const leftStart = this.getStartPattern(row, rows, columns, securityLevel)
      for (const bit of leftStart) {
        rowData[pos++] = bit as DotValue
      }

      // 数据码字
      for (let col = 0; col < columns; col++) {
        const codeword = codewords[row * columns + col] ?? 900
        const pattern = this.getCodewordPattern(codeword)
        for (const bit of pattern) {
          rowData[pos++] = bit as DotValue
        }
      }

      // 右终止码字
      const rightStop = this.getStopPattern(row, rows, columns, securityLevel)
      for (const bit of rightStop) {
        rowData[pos++] = bit as DotValue
      }

      matrix.push(rowData)
    }

    return matrix
  }

  private getStartPattern(row: number, rows: number, columns: number, securityLevel: number): number[] {
    // 起始码字模式（简化）
    const tableIndicator = this.getTableIndicator(row, rows, securityLevel)
    const pattern: number[] = Array.from({ length: 17 }, () => 0)

    // 简化的起始模式
    pattern[0] = 1
    pattern[4] = 1
    pattern[8] = 1
    pattern[12] = 1

    // 根据表指示符调整
    if (tableIndicator & 1)
      pattern[2] = 1
    if (tableIndicator & 2)
      pattern[6] = 1
    if (tableIndicator & 4)
      pattern[10] = 1

    return pattern
  }

  private getStopPattern(row: number, rows: number, _columns: number, _securityLevel: number): number[] {
    // 终止码字模式（18 个模块宽）
    const pattern: number[] = Array.from({ length: 18 }, () => 0)

    // 简化的终止模式
    pattern[0] = 1
    pattern[4] = 1
    pattern[8] = 1
    pattern[12] = 1
    pattern[16] = 1

    // 根据行位置调整
    if (row === 0) {
      pattern[2] = 1
    }
    if (row === rows - 1) {
      pattern[14] = 1
    }

    return pattern
  }

  private getCodewordPattern(codeword: number): number[] {
    // 返回码字对应的条空模式
    if (codeword < CODEWORD_PATTERNS.length) {
      return CODEWORD_PATTERNS[codeword]
    }

    // 默认模式
    const pattern: number[] = Array.from({ length: 17 }, () => 0)
    const pos = codeword % 17
    pattern[pos] = 1
    pattern[(pos + 4) % 17] = 1
    pattern[(pos + 8) % 17] = 1
    pattern[(pos + 12) % 17] = 1

    return pattern
  }

  private getTableIndicator(row: number, rows: number, _securityLevel: number): number {
    // 表指示符：决定使用哪个条码表
    // 0 = 表 0, 1 = 表 1, 2 = 表 2
    if (row === 0)
      return 0
    if (row === rows - 1)
      return 2
    return 1
  }
}
