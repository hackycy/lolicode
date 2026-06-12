import { describe, expect, it } from 'vitest'
import { encode } from '../src/index'

describe('encode', () => {
  it('encodes a declarative matrix code request', () => {
    const result = encode({
      type: 'qrcode',
      content: 'LOLI',
      options: { errorLevel: 'H' },
    })

    expect(result.metadata.type).toBe('qrcode')
    expect(result.metadata.family).toBe('matrix')
    expect(result.metadata.errorLevel).toBe('H')
  })

  it('encodes a declarative linear code request', () => {
    const result = encode({
      type: 'code128',
      content: 'Hello',
    })

    expect(result.metadata.type).toBe('code128')
    expect(result.metadata.family).toBe('linear')
  })

  it('rejects unsupported code types at runtime', () => {
    expect(() =>
      encode({
        type: 'qrcode-micro',
        content: 'LOLI',
      } as never),
    ).toThrow('Unsupported code type: qrcode-micro')
  })
})
