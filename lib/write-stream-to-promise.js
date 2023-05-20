function writeStreamToPromise (ws) {
  return new Promise((resolve, reject) => {
    ws.on('error', reject)
    ws.on('finish', resolve)
  })
}

export default writeStreamToPromise
