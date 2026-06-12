/**
 * 验证输入内容是否为空
 */
export function isEmpty(content: string): boolean {
  return content.length === 0
}

/**
 * 验证内容长度是否在指定范围内
 */
export function isLengthValid(content: string, maxLength: number): boolean {
  return content.length > 0 && content.length <= maxLength
}

/**
 * 验证数字字符串
 */
export function isNumericString(content: string): boolean {
  return /^\d+$/.test(content)
}

/**
 * 验证 EAN-13 格式（12 或 13 位数字）
 */
export function isValidEAN13(content: string): boolean {
  return /^\d{12,13}$/.test(content)
}

/**
 * 验证 EAN-8 格式（7 或 8 位数字）
 */
export function isValidEAN8(content: string): boolean {
  return /^\d{7,8}$/.test(content)
}

/**
 * 验证 UPC-A 格式（11 或 12 位数字）
 */
export function isValidUPCA(content: string): boolean {
  return /^\d{11,12}$/.test(content)
}

/**
 * 验证 Code 39 字符集（大写字母、数字、特殊字符）
 */
export function isValidCode39(content: string): boolean {
  return /^[0-9A-Z \-.$/+%*]+$/.test(content)
}

/**
 * 验证 ITF 格式（偶数位数字）
 */
export function isValidITF(content: string): boolean {
  return /^\d+$/.test(content) && content.length % 2 === 0
}

/**
 * 计算 EAN/UPC 校验位
 */
export function calculateEANCheckDigit(digits: number[]): number {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  const remainder = sum % 10
  return remainder === 0 ? 0 : 10 - remainder
}
