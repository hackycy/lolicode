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

  getModuleCount(content: string): number {
    // 起始宽条(2) + 数据((content.length + 1) * 12) + 终止宽条(2) + 间隔(2)
    return 2 + (content.length + 1) * 12 + 2
  }

  encodeToModules(content: string): number[] {
    // 计算 Mod 10 校验位
    const checkDigit = this.calculateMod10Check(content)
    const fullContent = content + checkDigit

    const modules: number[] = []

    // 起始条（宽条，2 模块）
    modules.push(2)

    // 数据位
    for (let i = 0; i < fullContent.length; i++) {
      const digit = Number.parseInt(fullContent[i])
      const pattern = MSI_PATTERNS[digit]

      // 将条空模式转换为模块序列
      for (let j = 0; j < pattern.length; j++) {
        modules.push(pattern[j] === '1' ? 1 : 0)
      }
    }

    // 终止条（窄空-宽条）
    modules.push(1)
    modules.push(2)

    return this.normalizeModules(modules)
  }

  private calculateMod10Check(content: string): string {
    // Luhn 算法变体
    const digits = content.split('').map(Number)
    let sum = 0

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i]

      // 从右向左，偶数位乘以 2
      if ((digits.length - 1 - i) % 2 === 1) {
        digit *= 2
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10)
        }
      }

      sum += digit
    }

    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit.toString()
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
