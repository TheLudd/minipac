import { assert } from 'chai'
import isBundle from '../lib/is-bundle'

const { isFalse, isTrue } = assert

describe('isBundle', () => {
  it('returns false for strings', () => {
    isFalse(isBundle('hey'))
  })

  it('returns true for objects', () => {
    isTrue(isBundle({}))
  })
})
