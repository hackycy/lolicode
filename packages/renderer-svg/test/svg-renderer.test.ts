import { describe, expect, it } from 'vitest'
import { renderDataURL, renderSVG, SVGRenderer } from '../src'

describe('renderSVG', () => {
  it('renders raw matrix data as svg rectangles', () => {
    const result = renderSVG([
      [1, 0],
      [0, 1],
    ], { moduleSize: 3 })

    expect(result).toContain('<svg')
    expect(result).toContain('width="6"')
    expect(result).toContain('height="6"')
    expect(result.match(/<rect x=/g)).toHaveLength(2)
  })

  it('escapes color attributes', () => {
    const result = renderSVG([[1]], {
      foreground: '#000"<',
      background: '#fff&',
    })

    expect(result).toContain('fill="#000&quot;&lt;"')
    expect(result).toContain('fill="#fff&amp;"')
  })

  it('can include an xml declaration', () => {
    const result = renderSVG([[1]], { includeDeclaration: true })

    expect(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
  })

  it('encodes and renders matrix codes', () => {
    const result = renderSVG('Hello', { type: 'qrcode', encode: { margin: 1 } })

    expect(result).toContain('<svg')
    expect(result).toContain('shape-rendering="crispEdges"')
  })

  it('encodes and renders linear barcodes', () => {
    const result = renderSVG('ABC123', { type: 'code128' })

    expect(result).toContain('<svg')
    expect(result).toContain('<rect x=')
  })

  it('requires a type for string input', () => {
    // @ts-expect-error string shorthand must include a code type
    expect(() => renderSVG('Hello')).toThrow('SVG code rendering requires a code type')
  })

  it('rejects invalid module size', () => {
    expect(() => renderSVG([[1]], { moduleSize: 0 })).toThrow('moduleSize must be a positive number')
  })

  it('renders svg as data url', () => {
    const result = renderDataURL('Hello', { type: 'qrcode', encode: { margin: 1 } })

    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(decodeURIComponent(result.split(',')[1])).toContain('<svg')
  })
})

describe('sVGRenderer', () => {
  it('renders through the renderer interface', () => {
    const renderer = new SVGRenderer()
    const result = renderer.render({
      data: [[1]],
      width: 1,
      height: 1,
      metadata: { type: 'qrcode', family: 'matrix', generatedAt: 0 },
    })

    expect(renderer.name).toBe('svg')
    expect(result).toContain('<svg')
  })
})
