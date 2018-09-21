const {get, post, put, endpoint, baseUrl} = require('./hatena.api')
const xml2js = require('xml2js')
const parse = xml2js.parseString
const builder = new xml2js.Builder()

fixCodeLoop()

async function fixCodeLoop (nextPage = null) {
  return new Promise( async (resolve, reject) => {
    const url = nextPage ? nextPage : endpoint + '/entry'
    const xml = await get(url).catch(err => reject(err))
    parse(xml, async (err, res) => {
      if (err) reject(err)
      nextPage = getNextPage(res.feed.link)
      const blogPosts = res.feed.entry
      for(let i = 0; i < blogPosts.length; i++) {
        await updateCode(blogPosts[i]).catch(err => reject(err))
      }
      if (nextPage) return fixCodeLoop(nextPage)
      resolve('fin')
    })
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

const updateCode = async (blogPost) => {
  return new Promise((resolve, reject) => {
    let content = blogPost.content[0]._
    const categories = blogPost.category
    if(content) {
      content = searchAndFixCode(content, categories)
      blogPost.content[0]._ = content
      update(blogPost)
        .then(() => resolve())
        .catch(err => reject(err))
    } else {
      resolve()
    }
  })
}

const getLanguage = (categories) => {
  const javascript = ['javascript', 'node.js', 'vue.js', 'webpack', 'react', 'cordova']
  const php = ['php', 'cakephp', 'fuelphp', 'laravel']
  const nginx = ['nginx']
  const go = ['go']
  const python = ['python', 'tensorflow']
  const ruby = ['ruby', 'rails', 'capistrano']
  const zsh = ['shell', 'zsh', 'ubuntu', 'linux']
  const java = ['java', 'android']
  const swift = ['swift', 'ios']
  for(let i = 0; i < categories.length; i++) {
    let category = categories[i].$.term.toLowerCase()
    if(python.indexOf(category) !== -1) return 'python'
    if(go.indexOf(category) !== -1) return 'go'
    if(java.indexOf(category) !== -1) return 'java'
    if(swift.indexOf(category) !== -1) return 'swift'
    if(javascript.indexOf(category) !== -1) return 'javascript'
    if(php.indexOf(category) !== -1) return 'php'
    if(nginx.indexOf(category) !== -1) return 'nginx'
    if(ruby.indexOf(category) !== -1) return 'ruby'
    if(zsh.indexOf(category) !== -1) return 'zsh'
    return 'javascript'
  }
}

const searchAndFixCode = (content, categories) => {
  const rePre = /(<pre[\s\S]*?>([\s\S]+?)<\/pre>)/gm
  const res = content.match(rePre);
  if(!res) return content
  const lang = getLanguage(categories)
  const codeStartStr = "\n" + '```' + lang + "\n"
  const codeEndStr = "\n" + '```' + "\n"
  const reCode = /(<code[\s\S]*?>([\s\S]+?)<\/code>)/gm
  const reGt = /&gt;/g
  const reLt = /&lt;/g
  return content.replace(rePre, (match, p1, p2) => {
    p2 = p2.replace(reCode, '$2')
    p2 = p2.replace(reGt, '>')
    p2 = p2.replace(reLt, '<')
    return codeStartStr + p2 + codeEndStr
  })
}

const update = async (blogPost) => {
  const editLink = getEditUrl(blogPost.link)
  return new Promise((resolve, reject) => {
    let obj = { 'entry': blogPost }
    obj.entry.$ = {
      'xmlns': 'http://www.w3.org/2005/Atom',
      'xmlns:app': 'http://www.w3.org/2007/app'
    }
    delete(obj.entry.published)
    delete(obj.entry['app:edited'])
    delete(obj.entry.summary)
    delete(obj.entry.id)
    delete(obj.entry.link)
    put(editLink, builder.buildObject(obj))
      .then(() => resolve())
      .catch(err => reject(err))
  })
}

const getEditUrl = links => {
  for(let i = 0; i < links.length; i++) {
    if(links[i].$.rel === 'edit') {
      return links[i].$.href
    }
  }
}
