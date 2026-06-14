import { describe, expect, it } from 'vitest'
import { Lolicode } from '../src'

describe('lolicode vue package', () => {
  it('exports the lolicode component', () => {
    expect(Lolicode.name).toBe('Lolicode')
    expect(Lolicode.props).toHaveProperty('renderer')
    expect(Lolicode.props).toHaveProperty('content')
    expect(Lolicode.props).toHaveProperty('type')
  })
})
