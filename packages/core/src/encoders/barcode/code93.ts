import type { CodeType } from '../../types'
import { BarcodeEncoder } from './base'

// Code 93 字符集定义
const CODE93_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%'

// Code 93 编码表（每个字符的 9 位条空模式）
const CODE93_PATTERNS: string[] = [
  '100010100',
  '101001000',
  '101000100',
  '101000010',
  '100101000',
  '100100100',
  '100100010',
  '101010000',
  '100010010',
  '100001010',
  '110101000',
  '110100100',
  '110100010',
  '110010100',
  '110010010',
  '110001010',
  '101101000',
  '101100100',
  '101100010',
  '100110100',
  '100011010',
  '101001100',
  '101000110',
  '100101100',
  '100010110',
  '110110100',
  '110110010',
  '110101100',
  '110100110',
  '110010110',
  '110011010',
  '101101100',
  '101100110',
  '100110110',
  '100111010',
  '100101110',
  '111010100',
  '111010010',
  '111001010',
  '101101110',
  '101110110',
  '110101110',
  '100100110',
  '111011010',
  '111010110',
  '100110010',
  '101011110',
]

// Code 93 起始和终止字符
const START_STOP = '*'

/**
 * Code 93 编码器
 * Code 93 是 Code 39 的改进版，密度更高
 * 支持 A-Z, 0-9, 特殊字符
 * 每个字符 9 模块（3 条 + 3 空）
 * 含两个校验字符 C 和 K
 */
export class Code93Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'code93'
  }

  getMaxLength(): number {
    return 80
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    for (let i = 0; i < content.length; i++) {
      if (!CODE93_CHARS.includes(content[i]))
        return false
    }
    return true
  }

  getModuleCount(content: string): number {
    // 起始(9) + 数据(content.length * 9) + 校验C(9) + 校验K(9) + 终止(9) + 终止条(1)
    return (content.length + 4) * 9 + 1
  }

  encodeToModules(content: string): number[] {
    // 计算校验字符
    const checkC = this.calculateCheckC(content)
    const checkK = this.calculateCheckK(content + checkC)

    const fullContent = `${START_STOP}${content}${checkC}${checkK}${START_STOP}`
    const modules: number[] = []

    for (const char of fullContent) {
      const pattern = this.getCharPattern(char)
      for (const bit of pattern) {
        modules.push(bit === '1' ? 1 : 1)
      }
    }

    // 终止条（额外的窄条）
    modules.push(1)

    return this.convertToBarSpace(modules)
  }

  private getCharPattern(char: string): string {
    if (char === '*') {
      // 起始/终止字符
      return '101100100'
    }

    const index = CODE93_CHARS.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid Code 93 character: ${char}`)
    }
    return CODE93_PATTERNS[index]
  }

  private calculateCheckC(content: string): string {
    let sum = 0
    const weights = [20, 15, 10, 5, 4, 3, 2, 1]

    for (let i = 0; i < content.length; i++) {
      const charIndex = CODE93_CHARS.indexOf(content[i])
      const weightIndex = (content.length - 1 - i) % weights.length
      sum += charIndex * weights[weightIndex]
    }

    return CODE93_CHARS[sum % 47]
  }

  private calculateCheckK(content: string): string {
    let sum = 0
    const weights = [15, 10, 5, 4, 3, 2, 1]

    for (let i = 0; i < content.length; i++) {
      const charIndex = CODE93_CHARS.indexOf(content[i])
      const weightIndex = (content.length - 1 - i) % weights.length
      sum += charIndex * weights[weightIndex]
    }

    return CODE93_CHARS[sum % 47]
  }

  private convertToBarSpace(bitModules: number[]): number[] {
    // 将 bit 模式转换为条空序列
    const modules: number[] = []
    let currentBit = '1'
    let count = 0

    for (const bit of bitModules) {
      if (bit === 1) {
        if (currentBit === '1') {
          count++
        }
        else {
          if (count > 0)
            modules.push(count)
          currentBit = '1'
          count = 1
        }
      }
      else {
        if (currentBit === '0') {
          count++
        }
        else {
          if (count > 0)
            modules.push(count)
          currentBit = '0'
          count = 1
        }
      }
    }

    if (count > 0)
      modules.push(count)
    return modules
  }
}
