import type { DotValue } from '../../types'

/**
 * QR Code 掩码模式函数
 * 每个函数根据 (row, col) 决定是否翻转该模块
 */
export const MASK_PATTERNS: Array<(row: number, col: number) => boolean> = [
  // 0: (i + j) mod 2 == 0
  (row, col) => (row + col) % 2 === 0,
  // 1: i mod 2 == 0
  row => row % 2 === 0,
  // 2: j mod 3 == 0
  (_row, col) => col % 3 === 0,
  // 3: (i + j) mod 3 == 0
  (row, col) => (row + col) % 3 === 0,
  // 4: (floor(i/2) + floor(j/3)) mod 2 == 0
  (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  // 5: (i*j) mod 2 + (i*j) mod 3 == 0
  (row, col) => (row * col) % 2 + (row * col) % 3 === 0,
  // 6: ((i*j) mod 2 + (i*j) mod 3) mod 2 == 0
  (row, col) => ((row * col) % 2 + (row * col) % 3) % 2 === 0,
  // 7: ((i+j) mod 2 + (i*j) mod 3) mod 2 == 0
  (row, col) => ((row + col) % 2 + (row * col) % 3) % 2 === 0,
]

/**
 * 对矩阵应用掩码
 */
export function applyMask(
  matrix: DotValue[][],
  isFunctionModule: boolean[][],
  maskIndex: number,
): DotValue[][] {
  const size = matrix.length
  const maskFn = MASK_PATTERNS[maskIndex]
  const result = matrix.map(row => [...row])

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isFunctionModule[row][col] && maskFn(row, col)) {
        result[row][col] = result[row][col] === 0 ? 1 : 0
      }
    }
  }

  return result
}

/**
 * 计算掩码惩罚得分，用于选择最优掩码
 */
export function calculatePenalty(matrix: DotValue[][]): number {
  const size = matrix.length
  let penalty = 0

  // 规则 1：连续相同颜色的模块
  for (let row = 0; row < size; row++) {
    let count = 1
    for (let col = 1; col < size; col++) {
      if (matrix[row][col] === matrix[row][col - 1]) {
        count++
      }
      else {
        if (count >= 5)
          penalty += count - 2
        count = 1
      }
    }
    if (count >= 5)
      penalty += count - 2
  }

  for (let col = 0; col < size; col++) {
    let count = 1
    for (let row = 1; row < size; row++) {
      if (matrix[row][col] === matrix[row - 1][col]) {
        count++
      }
      else {
        if (count >= 5)
          penalty += count - 2
        count = 1
      }
    }
    if (count >= 5)
      penalty += count - 2
  }

  // 规则 2：2x2 同色块
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const val = matrix[row][col]
      if (val === matrix[row][col + 1]
        && val === matrix[row + 1][col]
        && val === matrix[row + 1][col + 1]) {
        penalty += 3
      }
    }
  }

  // 规则 3：查找器样图案 (10111010000 / 00001011101)
  const pattern1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
  const pattern2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - 11; col++) {
      let match1 = true
      let match2 = true
      for (let k = 0; k < 11; k++) {
        if (matrix[row][col + k] !== pattern1[k])
          match1 = false
        if (matrix[row][col + k] !== pattern2[k])
          match2 = false
      }
      if (match1 || match2)
        penalty += 40
    }
  }
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - 11; row++) {
      let match1 = true
      let match2 = true
      for (let k = 0; k < 11; k++) {
        if (matrix[row + k][col] !== pattern1[k])
          match1 = false
        if (matrix[row + k][col] !== pattern2[k])
          match2 = false
      }
      if (match1 || match2)
        penalty += 40
    }
  }

  // 规则 4：黑白模块比例
  let darkCount = 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col] === 1)
        darkCount++
    }
  }
  const total = size * size
  const percentage = (darkCount / total) * 100
  const prev5 = Math.floor(percentage / 5) * 5
  const next5 = prev5 + 5
  penalty += Math.min(
    Math.abs(prev5 - 50) / 5,
    Math.abs(next5 - 50) / 5,
  ) * 10

  return penalty
}
