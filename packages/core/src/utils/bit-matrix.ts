import type { DotMatrix, DotValue } from '../types/matrix'

/**
 * 给点阵添加边距
 */
export function addMargin(matrix: DotMatrix, margin: number): DotMatrix {
  if (margin <= 0)
    return matrix

  const { data, width, height, metadata } = matrix
  const newWidth = width + margin * 2
  const newHeight = height + margin * 2
  const newData: DotValue[][] = []

  for (let row = 0; row < newHeight; row++) {
    const newRow: DotValue[] = Array.from({ length: newWidth }).fill(0) as DotValue[]
    if (row >= margin && row < margin + height) {
      for (let col = 0; col < width; col++) {
        newRow[col + margin] = data[row - margin][col]
      }
    }
    newData.push(newRow)
  }

  return {
    data: newData,
    width: newWidth,
    height: newHeight,
    metadata,
  }
}

/**
 * 反转点阵颜色
 */
export function invertMatrix(matrix: DotMatrix): DotMatrix {
  const newData = matrix.data.map(row =>
    row.map(cell => (cell === 0 ? 1 : 0) as DotValue),
  )

  return {
    ...matrix,
    data: newData,
  }
}

/**
 * 调整点阵大小（最近邻采样）
 */
export function resizeMatrix(matrix: DotMatrix, scale: number): DotMatrix {
  if (scale === 1)
    return matrix

  const { data, width, height, metadata } = matrix
  const newWidth = Math.round(width * scale)
  const newHeight = Math.round(height * scale)
  const newData: DotValue[][] = []

  for (let row = 0; row < newHeight; row++) {
    const srcRow = Math.min(Math.floor(row / scale), height - 1)
    const newRow: DotValue[] = []
    for (let col = 0; col < newWidth; col++) {
      const srcCol = Math.min(Math.floor(col / scale), width - 1)
      newRow.push(data[srcRow][srcCol])
    }
    newData.push(newRow)
  }

  return {
    data: newData,
    width: newWidth,
    height: newHeight,
    metadata,
  }
}

/**
 * 验证点阵内容是否有效
 */
export function validateContent(content: string, maxLength: number): boolean {
  return content.length > 0 && content.length <= maxLength
}
