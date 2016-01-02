const fs = require('fs')
const assign = require('object-assign')
const revHash = require('rev-hash')
const revPath = require('rev-path')
const sortKeys = require('sort-keys')
// alias
const read = fs.readFileSync
const write = fs.writeFileSync
const rename = fs.renameSync

export default function () {
  let manifest = {} // reset on call

  this.rev = function (options) {
    // overwrite default opt values
    const opts = assign({
      base: '',
      path: 'rev-manifest.json'
    }, options)

    // handle all this.source(...) files
    this.unwrap(files => files.map(name => {
      let revved = hashify(name)

      // rename the original file
      rename(name, revved)

      // strip the base from path
      name = relPath(opts.base, name)
      revved = relPath(opts.base, revved)

      // add pairing to manifest
      manifest[name] = revved
    })).then(() => {
      manifest = sortKeys(manifest)
      const data = JSON.stringify(manifest, false, '  ')
      return write(`${opts.base}/${opts.path}`, data)
    })

    // return this // chain
  }
}

function hashify (name) {
  const buff = read(name)
  const hash = revHash(buff)

  const idx = name.indexOf('.')
  const extn = name.slice(idx)

  const revved = (idx === -1) ? name : name.slice(0, idx)

  return revPath(revved, hash) + (idx === -1 ? '' : extn)
}

function relPath(base, path) {
  if (path.indexOf(base) !== 0) {
    return path.replace(/\\/g, '/')
  }

  const newPath = path.substr(base.length).replace(/\\/g, '/')

  if (newPath[0] === '/') {
    return newPath.substr(1)
  }

  return newPath;
}
