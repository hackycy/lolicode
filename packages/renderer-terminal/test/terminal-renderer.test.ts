import type { DotMatrix } from '@lolicode/core'
import { describe, expect, it } from 'vitest'
import { TerminalRenderer } from '../src/terminal-renderer'

function makeSimpleMatrix(): DotMatrix {
  // 3x3 矩阵:
  // 1 0 1
  // 0 1 0
  // 1 0 1
  return {
    data: [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ],
    width: 3,
    height: 3,
    metadata: {
      type: 'qrcode',
      generatedAt: Date.now(),
    },
  }
}

describe('terminalRenderer', () => {
  it('renders with default characters', () => {
    const renderer = new TerminalRenderer()
    const matrix = makeSimpleMatrix()
    const result = renderer.render(matrix)

    const lines = result.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('██  ██')
    expect(lines[1]).toBe('  ██  ')
    expect(lines[2]).toBe('██  ██')
  })

  it('renders with custom characters', () => {
    const renderer = new TerminalRenderer()
    const matrix = makeSimpleMatrix()
    const result = renderer.render(matrix, {
      filledChar: '##',
      emptyChar: '..',
    })

    const lines = result.split('\n')
    expect(lines[0]).toBe('##..##')
    expect(lines[1]).toBe('..##..')
    expect(lines[2]).toBe('##..##')
  })

  it('renders single character mode', () => {
    const renderer = new TerminalRenderer()
    const matrix = makeSimpleMatrix()
    const result = renderer.render(matrix, {
      filledChar: '#',
      emptyChar: '.',
    })

    const lines = result.split('\n')
    expect(lines[0]).toBe('#.#')
    expect(lines[1]).toBe('.#.')
    expect(lines[2]).toBe('#.#')
  })

  it('applies ANSI color when useColor is true', () => {
    const renderer = new TerminalRenderer()
    const matrix = makeSimpleMatrix()
    const result = renderer.render(matrix, { useColor: true })

    // ANSI: filled = \x1B[40m (black bg), empty = \x1B[47m (white bg), reset = \x1B[0m
    expect(result).toContain('\x1B[40m')
    expect(result).toContain('\x1B[47m')
    expect(result).toContain('\x1B[0m')
  })

  it('handles empty matrix', () => {
    const renderer = new TerminalRenderer()
    const matrix: DotMatrix = {
      data: [],
      width: 0,
      height: 0,
      metadata: {
        type: 'qrcode',
        generatedAt: Date.now(),
      },
    }
    const result = renderer.render(matrix)
    expect(result).toBe('')
  })

  it('handles single row matrix', () => {
    const renderer = new TerminalRenderer()
    const matrix: DotMatrix = {
      data: [[1, 0, 1]],
      width: 3,
      height: 1,
      metadata: {
        type: 'code128',
        contentLength: 3,
        generatedAt: Date.now(),
      },
    }
    const result = renderer.render(matrix, { filledChar: '#', emptyChar: '.' })
    expect(result).toBe('#.#')
  })

  it('has correct name', () => {
    const renderer = new TerminalRenderer()
    expect(renderer.name).toBe('terminal')
  })
})
