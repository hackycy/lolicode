// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
  },
  {
    files: ['playground/**'],
    rules: {
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
)
