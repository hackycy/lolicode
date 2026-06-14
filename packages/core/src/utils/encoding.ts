/**
 * 获取字符的字节数组（UTF-8）
 */
export function getBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
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
