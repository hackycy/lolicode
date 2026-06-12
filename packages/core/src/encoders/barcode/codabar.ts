import type { CodeType } from '../../types'
import { BarcodeEncoder } from './base'

// Codabar 字符集
const CODABAR_CHARS = '0123456789-$:/.+ABCD'

// Codabar 编码表（每个字符的条空模式，4 条 + 3 空）
const CODABAR_PATTERNS: string[] = [
  '101010011', // 0
  '101011001', // 1
  '101001011', // 2
  '110010101', // 3
  '101101001', // 4
  '110101001', // 5
  '100101011', // 6
  '100101101', // 7
  '100110101', // 8
  '110100101', // 9
  '101001101', // -
  '101100101', // $
  '1101011011', // :
  '1101101011', // /
  '1101101101', // .
  '1011011011', // +
  '1011001001', // A
  '1010010011', // B
  '1001001011', // C
  '1010011001', // D
]

/**
 * Codabar 编码器
 * 用于血库、图书馆、快递单等
 * 支持 0-9, -, $, :, /, ., + 和起止符 A, B, C, D
 */
export class CodabarEncoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'codabar'
  }

  getMaxLength(): number {
    return 100
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    for (let i = 0; i < content.length; i++) {
      if (!CODABAR_CHARS.includes(content[i]))
        return false
    }
    return true
  }

  getModuleCount(content: string): number {
    // 每个字符 9 模块（4 条 + 3 空），字符间有窄空间隔
    return content.length * 9 + (content.length - 1) * 1
  }

  encodeToModules(content: string): number[] {
    const modules: number[] = []

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const pattern = CODABAR_PATTERNS[CODABAR_CHARS.indexOf(char)]

      // 将条空模式转换为模块序列
      for (let j = 0; j < pattern.length; j++) {
        const width = pattern[j] === '1' ? 1 : 0
        if (width > 0) {
          modules.push(width)
        }
        else {
          // 空格
          modules.push(1)
        }
      }

      // 字符间窄空间隔
      if (i < content.length - 1) {
        modules.push(1)
      }
    }

    return this.normalizeModules(modules)
  }

  private normalizeModules(modules: number[]): number[] {
    // 合并相邻的相同类型模块
    const result: number[] = []
    let current = modules[0]
    let count = 1

    for (let i = 1; i < modules.length; i++) {
      if (modules[i] === current) {
        count++
      }
      else {
        result.push(count)
        current = modules[i]
        count = 1
      }
    }
    result.push(count)
    return result
  }
}
