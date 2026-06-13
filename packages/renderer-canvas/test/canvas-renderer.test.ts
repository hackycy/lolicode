import { describe, expect, it } from 'vitest'
import { CanvasRenderer, renderCanvas } from '../src'

interface FillCall {
  fillStyle: string
  height: number
  width: number
  x: number
  y: number
}

function createContext() {
  const calls: FillCall[] = []
  const clears: FillCall[] = []
  const context = {
    canvas: { width: 0, height: 0 },
    fillStyle: '',
    fillRect(x: number, y: number, width: number, height: number) {
      calls.push({ fillStyle: this.fillStyle, x, y, width, height })
    },
    clearRect(x: number, y: number, width: number, height: number) {
      clears.push({ fillStyle: this.fillStyle, x, y, width, height })
    },
  }

  return { calls, clears, context }
}

describe('renderCanvas', () => {
  it('renders raw matrix data to a 2d context', () => {
    const { calls, clears, context } = createContext()

    const result = renderCanvas([
      [1, 0],
      [0, 1],
    ], { target: context, moduleSize: 3, foreground: 'black', background: 'white' })

    expect(result).toBe(context)
    expect(context.canvas.width).toBe(6)
    expect(context.canvas.height).toBe(6)
    expect(clears[0]).toMatchObject({ x: 0, y: 0, width: 6, height: 6 })
    expect(calls).toEqual([
      { fillStyle: 'white', x: 0, y: 0, width: 6, height: 6 },
      { fillStyle: 'black', x: 0, y: 0, width: 3, height: 3 },
      { fillStyle: 'black', x: 3, y: 3, width: 3, height: 3 },
    ])
  })

  it('accepts a canvas element target', () => {
    const { context } = createContext()
    const canvas = {
      width: 0,
      height: 0,
      getContext(contextId: '2d') {
        expect(contextId).toBe('2d')
        return context
      },
    }

    renderCanvas([[1, 1]], { target: canvas, moduleSize: 2 })

    expect(canvas.width).toBe(4)
    expect(canvas.height).toBe(2)
  })

  it('encodes and renders matrix codes', () => {
    const { calls, context } = createContext()

    renderCanvas('Hello', { target: context, type: 'qrcode', encode: { margin: 1 } })

    expect(calls.length).toBeGreaterThan(1)
  })

  it('encodes and renders linear barcodes', () => {
    const { context } = createContext()

    renderCanvas('ABC123', { target: context, type: 'code128' })

    expect(context.canvas.width).toBeGreaterThan(context.canvas.height)
  })

  it('requires a type for string input', () => {
    const { context } = createContext()

    // @ts-expect-error string shorthand must include a code type
    expect(() => renderCanvas('Hello', { target: context })).toThrow('Canvas code rendering requires a code type')
  })

  it('rejects invalid module size', () => {
    const { context } = createContext()

    expect(() => renderCanvas([[1]], { target: context, moduleSize: 0 })).toThrow('moduleSize must be a positive number')
  })

  it('rejects unavailable 2d context', () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext() {
        return null
      },
    }

    expect(() => renderCanvas([[1]], { target: canvas })).toThrow('Canvas 2D context is not available')
  })
})

describe('canvasRenderer', () => {
  it('renders through the renderer interface', () => {
    const renderer = new CanvasRenderer()
    const { context } = createContext()
    const result = renderer.render({
      data: [[1]],
      width: 1,
      height: 1,
      metadata: { type: 'qrcode', family: 'matrix', generatedAt: 0 },
    }, { target: context })

    expect(renderer.name).toBe('canvas')
    expect(result).toBe(context)
  })

  it('requires a target', () => {
    const renderer = new CanvasRenderer()

    expect(() => renderer.render([[1]])).toThrow('Canvas renderer requires a target')
  })
})
