import { assert } from 'chai'
import { describe, it } from 'mocha'
import { getPackageVersion } from '../lib/get-module-file-name.js'

describe('getPackageVersion', () => {
  it('works when package.json is available', () => {
    const result = getPackageVersion('mocha')
    assert.equal(result, '6.2.2')
  })

  it('works whn package.json is not available', () => {
    const result = getPackageVersion('handsontable')
    assert.equal(result, '15.2.0')
  })
})
