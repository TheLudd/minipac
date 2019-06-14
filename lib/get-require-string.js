function getRequireString (asset) {
  return typeof asset === 'string'
    ? asset
    : `${asset.name}/${asset.require}`
}

module.exports = getRequireString
