/**
 * ECC200 (Data Matrix) Reed-Solomon 纠错
 *
 * 与 QR 不同，Data Matrix ECC200 使用本原多项式 0x12D，
 * 且生成多项式的根从 alpha^1 开始（QR 从 alpha^0 开始）。
 * 算法移植自 ISO/IEC 16022 附录 E。
 */

const MOD = 0x12D

const LOG: number[] = Array.from({ length: 256 }, () => 0)
const ALOG: number[] = Array.from({ length: 255 }, () => 0)

let seed = 1
for (let i = 0; i < 255; i++) {
  ALOG[i] = seed
  LOG[seed] = i
  seed <<= 1
  if (seed >= 256)
    seed ^= MOD
}

/**
 * 生成 numEC 个纠错码字所需的生成多项式系数（根 alpha^1..alpha^numEC），
 * 返回长度为 numEC 的系数数组（不含首项 1）。
 */
function generatorPoly(numEC: number): number[] {
  let poly = [1]
  for (let degree = 1; degree <= numEC; degree++) {
    const root = ALOG[degree % 255]
    const next: number[] = Array.from({ length: poly.length + 1 }, () => 0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j] === 0 || root === 0 ? 0 : ALOG[(LOG[poly[j]] + LOG[root]) % 255]
      next[j + 1] ^= poly[j]
    }
    poly = next
  }
  return poly.slice(0, numEC)
}

/**
 * 为单个数据块计算 ECC200 纠错码字。
 */
export function calculateECC200(data: number[], numEC: number): number[] {
  const poly = generatorPoly(numEC)
  const ecc: number[] = Array.from({ length: numEC }, () => 0)

  for (const codeword of data) {
    const m = ecc[numEC - 1] ^ codeword
    for (let k = numEC - 1; k > 0; k--) {
      if (m !== 0 && poly[k] !== 0)
        ecc[k] = ecc[k - 1] ^ ALOG[(LOG[m] + LOG[poly[k]]) % 255]
      else
        ecc[k] = ecc[k - 1]
    }
    ecc[0] = m !== 0 && poly[0] !== 0 ? ALOG[(LOG[m] + LOG[poly[0]]) % 255] : 0
  }

  return ecc.reverse()
}
