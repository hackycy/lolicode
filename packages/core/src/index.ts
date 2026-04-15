export const CORE_PACKAGE_NAME = '@lolicode/core'

export function createCoreTag(name: string): string {
  return `${CORE_PACKAGE_NAME}:${name}`
}
