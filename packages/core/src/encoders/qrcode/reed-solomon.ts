/**
 * GF(2^8) 有限域运算，用于 Reed-Solomon 纠错
 * 不可约多项式: x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
 */

const PRIMITIVE_POLY = 0x11D

// 对数表和指数表
const LOG_TABLE: number[] = Array.from({ length: 256 })
const EXP_TABLE: number[] = Array.from({ length: 512 })

// 初始化 GF(2^8) 查找表
let val = 1
for (let i = 0; i < 255; i++) {
  EXP_TABLE[i] = val
  LOG_TABLE[val] = i
  val <<= 1
  if (val >= 256) {
    val ^= PRIMITIVE_POLY
  }
}
for (let i = 255; i < 512; i++) {
  EXP_TABLE[i] = EXP_TABLE[i - 255]
}

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0)
    return 0
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]]
}

/**
 * 生成 Reed-Solomon 生成多项式
 */
function generateGeneratorPoly(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const newPoly: number[] = Array.from({ length: poly.length + 1 }, () => 0)
    const factor = EXP_TABLE[i]
    for (let j = 0; j < poly.length; j++) {
      newPoly[j] ^= gfMultiply(poly[j], factor)
      newPoly[j + 1] ^= poly[j]
    }
    poly = newPoly
  }
  return poly
}

/**
 * 计算 Reed-Solomon 纠错码
 * @param data 数据字节数组
 * @param ecCount 纠错码数量
 */
export function calculateReedSolomon(data: number[], ecCount: number): number[] {
  const generator = generateGeneratorPoly(ecCount)
  const remainder: number[] = Array.from({ length: ecCount }, () => 0)

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0]
    remainder.shift()
    remainder.push(0)
    for (let j = 0; j < ecCount; j++) {
      remainder[j] ^= gfMultiply(generator[j + 1], factor)
    }
  }

  return remainder
}
