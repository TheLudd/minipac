import { assert } from 'chai'
import getModuleName from '../lib/get-module-name'

const { equal } = assert

describe('getModuleName', () => {
  it('should return the name for simple modules', () => {
    const result = getModuleName('react')
    equal(result, 'react')
  })

  it('should return the scope and name for scoped', () => {
    const result = getModuleName('@scope/module')
    equal(result, '@scope/module')
  })

  it('should return the scope and name for scoped', () => {
    const result = getModuleName('module/subpath')
    equal(result, 'module')
  })

  it('should join several names', () => {
    const result = getModuleName([ 'react', 'react-dom' ])
    equal(result, 'react_react-dom')
  })

  it('should handle conf objects', () => {
    const result = getModuleName({
      name: 'react',
    })
    equal(result, 'react')
  })

  it('should handle several conf objects', () => {
    const result = getModuleName([ {
      name: 'react',
    }, {
      name: 'react-dom',
    } ])
    equal(result, 'react_react-dom')
  })
})
