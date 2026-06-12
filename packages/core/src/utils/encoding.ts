/**
 * 获取字符的字节数组（UTF-8）
 */
export function getBytes(text: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    }
    else if (code < 0x800) {
      bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F))
    }
    else if (code < 0xD800 || code >= 0xE000) {
      bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F))
    }
    else {
      // Surrogate pair
      i++
      const next = text.charCodeAt(i)
      const cp = ((code - 0xD800) << 10) + (next - 0xDC00) + 0x10000
      bytes.push(
        0xF0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3F),
        0x80 | ((cp >> 6) & 0x3F),
        0x80 | (cp & 0x3F),
      )
    }
  }
  return bytes
}

/**
 * 检查是否为纯数字
 */
export function isNumeric(text: string): boolean {
  return /^\d+$/.test(text)
}

/**
 * 检查是否为 QR Code 字母数字字符集
 * 0-9, A-Z, 空格, $, %, *, +, -, ., /, :
 */
export function isAlphanumeric(text: string): boolean {
  return /^[0-9A-Z $%*+\-./:]+$/.test(text)
}

/**
 * 字母数字字符到值的映射
 */
const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
const ALPHANUMERIC_MAP = new Map<string, number>()

for (let i = 0; i < ALPHANUMERIC_CHARS.length; i++) {
  ALPHANUMERIC_MAP.set(ALPHANUMERIC_CHARS[i], i)
}

/**
 * 获取字母数字字符的值
 */
export function getAlphanumericValue(char: string): number {
  return ALPHANUMERIC_MAP.get(char) ?? -1
}
