import { describe, expect, it } from 'vitest'

import { CORE_PACKAGE_NAME, createCoreTag } from './index'

describe('@lolicode/core', () => {
  it('exports the package name', () => {
    expect(CORE_PACKAGE_NAME).toBe('@lolicode/core')
  })

  it('creates stable core tags', () => {
    expect(createCoreTag('runtime')).toBe('@lolicode/core:runtime')
  })
})
