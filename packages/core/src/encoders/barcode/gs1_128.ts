import type { CodeType } from '../../types'
import { BarcodeEncoder } from './base'

// Code 128 编码表（与 Code 128 共用）
const CODE128_PATTERNS: number[][] = [
  [2, 1, 2, 2, 2, 2],
  [2, 2, 2, 1, 2, 2],
  [2, 2, 2, 2, 2, 1],
  [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2],
  [1, 3, 1, 2, 2, 2],
  [1, 2, 2, 2, 1, 3],
  [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2],
  [2, 2, 1, 2, 1, 3],
  [2, 2, 1, 3, 1, 2],
  [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2],
  [1, 2, 2, 1, 3, 2],
  [1, 2, 2, 2, 3, 1],
  [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2],
  [1, 2, 3, 2, 2, 1],
  [2, 2, 3, 2, 1, 1],
  [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1],
  [2, 1, 3, 2, 1, 2],
  [2, 2, 3, 1, 1, 2],
  [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2],
  [3, 2, 1, 1, 2, 2],
  [3, 2, 1, 2, 2, 1],
  [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2],
  [3, 2, 2, 2, 1, 1],
  [2, 1, 2, 1, 2, 3],
  [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1],
  [1, 1, 1, 3, 2, 3],
  [1, 3, 1, 1, 2, 3],
  [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3],
  [1, 3, 2, 1, 1, 3],
  [1, 3, 2, 3, 1, 1],
  [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3],
  [2, 3, 1, 3, 1, 1],
  [1, 1, 2, 1, 3, 3],
  [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1],
  [1, 1, 3, 1, 2, 3],
  [1, 1, 3, 3, 2, 1],
  [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1],
  [2, 1, 1, 3, 3, 1],
  [2, 3, 1, 1, 3, 1],
  [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1],
  [2, 1, 3, 1, 3, 1],
  [3, 1, 1, 1, 2, 3],
  [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1],
  [3, 1, 2, 1, 1, 3],
  [3, 1, 2, 3, 1, 1],
  [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1],
  [2, 2, 1, 4, 1, 1],
  [4, 3, 1, 1, 1, 1],
  [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2],
  [1, 2, 1, 1, 2, 4],
  [1, 2, 1, 4, 2, 1],
  [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1],
  [1, 1, 2, 2, 1, 4],
  [1, 1, 2, 4, 1, 2],
  [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1],
  [1, 4, 2, 1, 1, 2],
  [1, 4, 2, 2, 1, 1],
  [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4],
  [4, 1, 3, 1, 1, 1],
  [2, 4, 1, 1, 1, 2],
  [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2],
  [1, 2, 1, 1, 4, 2],
  [1, 2, 1, 2, 4, 1],
  [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2],
  [1, 2, 4, 2, 1, 1],
  [4, 1, 1, 2, 1, 2],
  [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1],
  [2, 1, 2, 1, 4, 1],
  [2, 1, 4, 1, 2, 1],
  [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3],
  [1, 1, 1, 3, 4, 1],
  [1, 3, 1, 1, 4, 1],
  [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1],
  [4, 1, 1, 1, 1, 3],
  [4, 1, 1, 3, 1, 1],
  [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1],
  [3, 1, 1, 1, 4, 1],
  [4, 1, 1, 1, 3, 1], // 102 FNC1
  [2, 1, 1, 4, 1, 2], // 103 START A
  [2, 1, 1, 2, 1, 4], // 104 START B
  [2, 1, 1, 2, 3, 2], // 105 START C
  [2, 3, 3, 1, 1, 1], // 106 STOP
]

const CODE_B_START = 104
const CODE_C_START = 105
const CODE_C_SWITCH = 99
const FNC1 = 102
const STOP_CODE = 106

/**
 * GS1-128 编码器
 * 基于 Code 128，用于供应链标识（如 GTIN、批次号、有效期等）
 * 结构: START + FNC1 + 数据 + CHECKSUM + STOP
 * 支持 Application Identifier (AI) 编码
 */
export class GS1_128Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'gs1_128'
  }

  getMaxLength(): number {
    return 48
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    // 支持数字和 AI 括号格式，如 (01)00012345678905
    for (let i = 0; i < content.length; i++) {
      const ch = content[i]
      if (ch >= '0' && ch <= '9')
        continue
      if (ch === '(' || ch === ')')
        continue
      return false
    }
    return true
  }

  getModuleCount(content: string): number {
    const digits = this.extractDigits(content)
    // START + FNC1 + data + CHECKSUM + STOP
    // 使用 Code C 模式（每2位数字1个符号）或 Code B 模式（每字符1个符号）
    const dataCodes = this.encodeData(digits)
    // start + FNC1 + dataCodes + checksum + stop = total symbols
    const symbolCount = 2 + dataCodes.length + 2
    return symbolCount * 11 + 2
  }

  encodeToModules(content: string): number[] {
    const digits = this.extractDigits(content)
    const dataCodes = this.encodeData(digits)

    // 选择起始码：优先 Code C（两位数字一起编码）
    const startCode = this.chooseStartCode(digits)
    const allCodes = [startCode, FNC1, ...dataCodes]

    const checksum = this.calculateChecksum(allCodes)
    allCodes.push(checksum, STOP_CODE)

    const modules: number[] = []
    for (const code of allCodes) {
      const pattern = CODE128_PATTERNS[code]
      for (let i = 0; i < 6; i++) {
        modules.push(pattern[i])
      }
    }

    return modules
  }

  private extractDigits(content: string): string {
    // 移除括号，只保留数字
    let digits = ''
    for (let i = 0; i < content.length; i++) {
      if (content[i] >= '0' && content[i] <= '9')
        digits += content[i]
    }
    return digits
  }

  private chooseStartCode(digits: string): number {
    // 偶数位数字用 Code C，否则用 Code B
    return digits.length % 2 === 0 ? CODE_C_START : CODE_B_START
  }

  private encodeData(digits: string): number[] {
    const codes: number[] = []
    let i = 0

    // 如果起始码是 Code B，先编码第一个字符
    if (digits.length % 2 !== 0) {
      codes.push(Number.parseInt(digits[0]) + 16) // Code B: 数字字符值 = ASCII - 32 = digit + 16
      i = 1
      // 切换到 Code C 模式
      if (i < digits.length) {
        codes.push(CODE_C_SWITCH)
      }
    }

    // 剩余数字用 Code C 模式（每两位一组）
    while (i < digits.length) {
      const pair = digits.substring(i, i + 2)
      codes.push(Number.parseInt(pair))
      i += 2
    }

    return codes
  }

  private calculateChecksum(codes: number[]): number {
    let sum = codes[0]
    for (let i = 1; i < codes.length; i++) {
      sum += codes[i] * i
    }
    return sum % 103
  }
}
