function getRequireString (asset) {
  return typeof asset === 'string'
    ? asset
    : `${asset.name}/${asset.require}`
}

export default getRequireString
