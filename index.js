const {get, post, put, endpoint, baseUrl} = require('./hatena.api')
const xml2js = require('xml2js')
const parse = xml2js.parseString
const builder = new xml2js.Builder()

updateUrlLoop()

async function updateUrlLoop (nextPage = null) {
  return new Promise( async (resolve, reject) => {
    const url = nextPage ? nextPage : endpoint + '/entry'
    const xml = await get(url).catch(err => reject(err))
    parse(xml, async (err, res) => {
      if (err) reject(err)
      nextPage = getNextPage(res.feed.link)
      const blogPosts = res.feed.entry
      for(let i = 0; i < blogPosts.length; i++) {
        let [editLink, correctUrl] = getEditUrlAndCorrectUrl(blogPosts[i].link)
        await updateUrl(blogPosts[i], editLink, correctUrl)
        .catch(err => reject(err))
      }
      if (nextPage) return updateUrlLoop(nextPage)
      resolve('fin')
    })
  })
}

const updateUrl = async (blogPost, editLink, correctUrl) => {
  return new Promise((resolve, reject) => {
    let obj = { 'entry': blogPost }
    obj.entry.$ = {
      'xmlns': 'http://www.w3.org/2005/Atom',
      'xmlns:app': 'http://www.w3.org/2007/app',
      'xmlns:opt': 'http://www.hatena.ne.jp/info/xmlns#hatenablog'
    }
    obj.entry['opt:custom-url'] = correctUrl
    delete(obj.entry.published)
    delete(obj.entry['app:edited'])
    delete(obj.entry.summary)
    delete(obj.entry.id)
    delete(obj.entry.link)
    console.log(baseUrl + correctUrl)
    put(editLink, builder.buildObject(obj))
      .then(() => resolve())
      .catch(err => reject(err))
  })
}

const getNextPage = links => {
  for(let i = 0; i < links.length; i++) {
    if (links[i].$.rel === 'next') {
      return links[i].$.href
    }
  }
  return null
}

const getEditUrlAndCorrectUrl = links => {
  let editLink = '', correctUrl = ''
  links.forEach(link => {
    switch (link.$.rel) {
      case 'alternate':
        correctUrl = fixUrl(link.$.href)
        break
      case 'edit':
        editLink = link.$.href
    }
  })
  return [editLink, correctUrl]
}

const fixUrl = url => {
  return url.replace(baseUrl, '').replace(/%25/g, '%')
}

