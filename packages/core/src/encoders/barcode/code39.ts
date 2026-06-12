import type { CodeType } from '../../types'
import { isValidCode39 } from '../../utils/validation'
import { BarcodeEncoder } from './base'

/**
 * Code 39 字符到条空模式映射
 * 每个字符 9 个元素：5 条 + 4 空，其中 3 个宽元素
 * W = 宽(3模块), N = 窄(1模块)
 * 用 1 表示宽, 0 表示窄
 */
const CODE39_CHARS: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010',
  '*': '010010100',
}

/**
 * Code 39 编码器
 */
export class Code39Encoder extends BarcodeEncoder {
  getType(): CodeType {
    return 'code39'
  }

  getMaxLength(): number {
    return 48
  }

  validate(content: string): boolean {
    return content.length > 0
      && content.length <= this.getMaxLength()
      && isValidCode39(content.toUpperCase())
  }

  encodeToRuns(content: string): number[] {
    const data = `*${content.toUpperCase()}*`
    const modules: number[] = []

    for (let i = 0; i < data.length; i++) {
      const pattern = CODE39_CHARS[data[i]]
      if (!pattern)
        throw new Error(`Invalid Code 39 character: ${data[i]}`)

      // 条空交替：条-空-条-空-条
      for (let j = 0; j < 9; j++) {
        const isWide = pattern[j] === '1'
        const width = isWide ? 3 : 1
        modules.push(width)

        // 在字符内，条空交替（0,2,4,6,8 是条，1,3,5,7 是空）
        // 最后一个元素后不加间隔
        if (j === 8 && i < data.length - 1) {
          modules.push(1) // 字符间窄空间隔
        }
      }
    }

    return modules
  }
}
