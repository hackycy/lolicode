import { code128 } from '@lolicode/core'
import { describe, expect, it } from 'vitest'
import { renderTerminal, TerminalRenderer } from '../src'

type DotValue = 0 | 1

describe('renderTerminal', () => {
  describe('utf8 mode (default)', () => {
    it('renders default utf8 mode', () => {
      const result = renderTerminal([
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ])
      // Row 0+1: top=[1,0,1] bottom=[0,1,0] -> ▀▄▀
      // Row 2 (odd, bottom=0): top=[1,0,1] bottom=[0,0,0] -> ▀ ▀
      expect(result).toBe('▀▄▀\n▀ ▀')
    })

    it('compresses 2 rows into 1 terminal row', () => {
      const result = renderTerminal([
        [1, 1],
        [1, 1],
      ])
      const lines = result.split('\n')
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('██')
    })

    it('handles odd height with bottom=0 for last row', () => {
      const result = renderTerminal([
        [1],
        [0],
        [1],
      ])
      const lines = result.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('▀') // top=1, bottom=0
      expect(lines[1]).toBe('▀') // top=1, bottom=0 (no bottom row)
    })
  })

  describe('ansi mode', () => {
    it('contains ANSI escape codes', () => {
      const result = renderTerminal([
        [1, 0],
        [0, 1],
      ], { mode: 'ansi' })
      expect(result).toContain('\x1B[40m')
      expect(result).toContain('\x1B[47m')
      expect(result).toContain('\x1B[0m')
    })

    it('has correct structure (2 columns per module)', () => {
      const result = renderTerminal([
        [1, 0],
      ], { mode: 'ansi' })
      const lines = result.split('\n')
      expect(lines).toHaveLength(1)
      // filled = black bg + 2 spaces + reset, empty = white bg + 2 spaces + reset
      expect(lines[0]).toBe('\x1B[40m  \x1B[0m\x1B[47m  \x1B[0m')
    })
  })

  describe('small mode', () => {
    it('contains both fg and bg ANSI codes', () => {
      const result = renderTerminal([
        [1, 0],
        [1, 0],
      ], { mode: 'small' })
      expect(result).toContain('\x1B[40m')
      expect(result).toContain('\x1B[47m')
      expect(result).toContain('\x1B[30m')
      expect(result).toContain('\x1B[37m')
    })

    it('is most compact (1 column per module, 2 rows compressed)', () => {
      const result = renderTerminal([
        [1, 1],
        [1, 1],
      ], { mode: 'small' })
      const lines = result.split('\n')
      expect(lines).toHaveLength(1)
    })

    it('renders half-block colors with foreground as the top module', () => {
      const result = renderTerminal([
        [1, 0],
        [0, 1],
      ], { mode: 'small' })

      expect(result).toBe('\x1B[47m\x1B[30m▀\x1B[0m\x1B[47m\x1B[30m▄\x1B[0m')
    })
  })

  describe('matrix code input', () => {
    it('encodes and renders a declarative matrix code request', () => {
      const result = renderTerminal({ type: 'qrcode', content: 'Hello' })

      expect(result).toContain('█')
      expect(result).toContain('\n')
    })

    it('encodes and renders matrix content with terminal options', () => {
      const result = renderTerminal('Hello', { type: 'qrcode', mode: 'small' })

      expect(result).toContain('\x1B[')
    })

    it('keeps raw matrix input on utf8 mode by default', () => {
      const result = renderTerminal([
        [1],
        [0],
      ])

      expect(result).toBe('▀')
    })

    it('rejects linear barcode DotMatrix input', () => {
      expect(() => renderTerminal(code128('A'))).toThrow('does not support linear barcodes')
    })

    it('rejects declarative linear barcode requests', () => {
      // @ts-expect-error linear barcodes are intentionally unsupported by terminal rendering
      expect(() => renderTerminal({ type: 'code128', content: 'A' })).toThrow('does not support linear barcodes')
    })

    it('rejects linear barcode string shorthand', () => {
      // @ts-expect-error linear barcodes are intentionally unsupported by terminal rendering
      expect(() => renderTerminal('A', { type: 'code128' })).toThrow('does not support linear barcodes')
    })
  })

  describe('margin', () => {
    it('adds correct number of empty rows and columns', () => {
      const result = renderTerminal([
        [1],
      ], { margin: 1 })
      // Matrix becomes 3x3 with 1 in center:
      // 0 0 0
      // 0 1 0
      // 0 0 0
      const lines = result.split('\n')
      expect(lines).toHaveLength(2) // 3 rows compressed to 2 terminal rows
    })

    it('margin 0 does not change output', () => {
      const matrix = [
        [1, 0],
        [0, 1],
      ] as DotValue[][]
      const noMargin = renderTerminal(matrix, { margin: 0 })
      const defaultMargin = renderTerminal(matrix)
      expect(noMargin).toBe(defaultMargin)
    })
  })

  describe('invert', () => {
    it('swaps filled and empty in utf8 mode', () => {
      const normal = renderTerminal([
        [1, 0],
        [0, 1],
      ])
      const inverted = renderTerminal([
        [1, 0],
        [0, 1],
      ], { invert: true })
      // Normal: top=[1,0] bottom=[0,1] -> '▀▄'
      // Inverted: top=[0,1] bottom=[1,0] -> '▄▀'
      expect(normal).toBe('▀▄')
      expect(inverted).toBe('▄▀')
    })

    it('all-zero inverted becomes all-one', () => {
      const allZero = [
        [0, 0],
        [0, 0],
      ] as DotValue[][]
      expect(renderTerminal(allZero)).toBe('  ')
      expect(renderTerminal(allZero, { invert: true })).toBe('██')
    })

    it('does not invert the virtual bottom row for odd-height utf8 output', () => {
      expect(renderTerminal([[0, 0]], { invert: true })).toBe('▀▀')
    })

    it('does not invert the virtual bottom row for odd-height small output', () => {
      expect(renderTerminal([[0]], { invert: true, mode: 'small' })).toBe('\x1B[47m\x1B[30m▀\x1B[0m')
    })
  })

  describe('edge cases', () => {
    it('empty matrix returns empty string', () => {
      const result = renderTerminal([])
      expect(result).toBe('')
    })

    it('single row matrix (odd height edge case)', () => {
      const result = renderTerminal([
        [1, 0, 1],
      ])
      const lines = result.split('\n')
      expect(lines).toHaveLength(1)
      // top=[1,0,1], bottom=[0,0,0] -> ▀ ▀
      expect(lines[0]).toBe('▀ ▀')
    })
  })
})

describe('terminalRenderer', () => {
  it('has correct name', () => {
    const renderer = new TerminalRenderer()
    expect(renderer.name).toBe('terminal')
  })

  it('renders via render method with full DotMatrix', () => {
    const renderer = new TerminalRenderer()
    const matrix = {
      data: [
        [1, 0, 1] as DotValue[],
        [0, 1, 0] as DotValue[],
        [1, 0, 1] as DotValue[],
      ],
      width: 3,
      height: 3,
      metadata: { type: 'qrcode' as const, family: 'matrix' as const, generatedAt: Date.now() },
    }
    const result = renderer.render(matrix)
    expect(result).toBe('▀▄▀\n▀ ▀')
  })

  it('rejects barcode matrices', () => {
    const renderer = new TerminalRenderer()
    expect(() => renderer.render(code128('A'))).toThrow('does not support linear barcodes')
  })

  it('passes options through', () => {
    const renderer = new TerminalRenderer()
    const matrix = {
      data: [
        [1, 0] as DotValue[],
        [0, 1] as DotValue[],
      ],
      width: 2,
      height: 2,
      metadata: { type: 'qrcode' as const, family: 'matrix' as const, generatedAt: Date.now() },
    }
    const result = renderer.render(matrix, { mode: 'ansi' })
    expect(result).toContain('\x1B[40m')
  })
})
