const {endpoint, apiKey, hatenaId, baseUrl} = require('./hatena.config')
let axios = require('axios')
axios = axios.create({
  auth: {
    username: hatenaId,
    password: apiKey
  }
})
exports.get = function get (url) {
  return new Promise((resolve, reject) => {
    axios.get(url)
    .then(res => resolve(res.data))
    .catch(err => reject(err.message))
  })
}
exports.put = function put (url, data) {
  return new Promise((resolve, reject) => {
    axios.put(url, data)
    .then(res => resolve(res.data))
    .catch(err => reject(err.message))
  })
}
exports.post = function post (url, data) {
  return new Promise((resolve, reject) => {
    axios.post(url, data)
    .then(res => resolve(res.data))
    .catch(err => reject(err.message))
  })
}
exports.endpoint = endpoint
exports.baseUrl = baseUrl
