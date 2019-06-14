function isBundle (asset) {
  return typeof asset !== 'string'
}

module.exports = isBundle
