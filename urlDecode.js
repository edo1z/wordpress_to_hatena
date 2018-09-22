const fs = require('fs')
const {Transform} = require('stream')

class UrlDecodeStream extends Transform {
  constructor(options) {
    super(options)
    this.str = ''
  }
  write (data) {
    let str = data.toString()
    const idx  = str.indexOf("\n")
    if(idx > -1) {
      let line = this.str + str.slice(0, idx)
      line = this.decodeLink(line)
      this.str = str.slice(idx)
      this.emit('data', line)
    } else {
      this.str += str
    }
  }
  end () {
    this.emit('data', this.str)
  }
  decodeLink (str) {
    const re = /(<link>)(.+?)(<\/link>)/gm
    if(!str.match(re)) return str
    return str.replace(re, (match, p1, p2, p3) => {
      return p1 + decodeURI(p2) + p3
    })
  }
}

const reader = fs.createReadStream('wp.xml')
const writer = fs.createWriteStream('new.xml')
const decoder = new UrlDecodeStream()
reader.pipe(decoder).pipe(writer)
