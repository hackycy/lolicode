import type { CodeType } from '../../types'
import { BarcodeEncoder } from './base'

// MSI Plessey 编码表（每个数字的条空模式）
const MSI_PATTERNS: string[] = [
  '100100100100', // 0
  '100100100110', // 1
  '100100110100', // 2
  '100100110110', // 3
  '100110100100', // 4
  '100110100110', // 5
  '100110110100', // 6
  '100110110110', // 7
  '110100100100', // 8
  '110100100110', // 9
]

/**
 * MSI Plessey 编码器
 * 用于库存管理、仓储标签
 * 仅支持数字
 * 含 Mod 10 校验位
 */
export class MSIEncoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'msi'
  }

  getMaxLength(): number {
    return 100
  }

  validate(content: string): boolean {
    if (content.length === 0 || content.length > this.getMaxLength())
      return false
    return /^\d+$/.test(content)
  }

  encodeToRuns(content: string): number[] {
    // 计算 Mod 10 校验位
    const checkDigit = this.calculateMod10Check(content)
    const fullContent = content + checkDigit

    let bits = '110'

    // 数据位
    for (let i = 0; i < fullContent.length; i++) {
      const digit = Number.parseInt(fullContent[i])
      bits += MSI_PATTERNS[digit]
    }

    bits += '1001'

    return this.bitsToModules(bits)
  }

  private calculateMod10Check(content: string): string {
    // 标准 MSI Mod 10：从右数奇数位数字拼成一个数后整体 ×2 再逐位求和，
    // 加上偶数位数字之和。
    const digits = content.split('').map(Number)
    let oddNumber = ''
    let evenSum = 0

    for (let i = 0; i < digits.length; i++) {
      // 从右数的位置（最右为 1）
      const posFromRight = digits.length - i
      if (posFromRight % 2 === 1) {
        oddNumber += digits[i].toString()
      }
      else {
        evenSum += digits[i]
      }
    }

    let oddSum = 0
    for (const ch of (Number.parseInt(oddNumber || '0', 10) * 2).toString()) {
      oddSum += Number(ch)
    }

    const checkDigit = (10 - ((oddSum + evenSum) % 10)) % 10
    return checkDigit.toString()
  }

  private bitsToModules(bits: string): number[] {
    const result: number[] = []
    let current = bits[0]
    let count = 1

    for (let i = 1; i < bits.length; i++) {
      if (bits[i] === current) {
        count++
      }
      else {
        result.push(count)
        current = bits[i]
        count = 1
      }
    }
    result.push(count)
    return result
  }
}
