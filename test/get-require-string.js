import { assert } from 'chai'
import getRequireString from '../lib/get-require-string'

const { equal } = assert

describe('getRequireString', () => {
  it('returns the same name for any string', () => {
    const result = getRequireString('whatever')
    equal(result, 'whatever')
  })

  it('returns the name and path for object configs', () => {
    const result = getRequireString({
      name: 'react',
      require: 'umd/react.production.min.js',
    })
    equal(result, 'react/umd/react.production.min.js')
  })
})
