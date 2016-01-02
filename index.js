const read = require('fs').readFileSync
const assign = require('object-assign')
const revHash = require('rev-hash')
const revPath = require('rev-path')
// const modName = require('modify-filename')
// const sortKeys = require('sort-keys')

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

export default function () {
  let manifest = {} // reset on call

  this.rev = function (options) {
    // overwrite default opt values
    const opts = assign({
      path: 'rev-manifest.json',
      merge: false,
      base: '.'
    }, options)

    // handle all this.source(...) files
    this.unwrap(files => files.map(name => {
      let revved = hashify(name)

      name = relPath(opts.base, name)
      revved = relPath(opts.base, revved)

      manifest[name] = revved
    })).then(() => {
      console.log( 'this manifest', manifest, opts )
    })

    return this // chain
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
