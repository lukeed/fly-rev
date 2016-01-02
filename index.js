const read = require('fs').readFileSync
const assign = require('object-assign')
const revHash = require('rev-hash')
const revPath = require('rev-path')
// const sortKeys = require('sort-keys')

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

      console.log( revved )

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

function manifest(pth, options) {
  if (typeof pth === 'string') {
    pth = {path: pth};
  }

  const opts = assign({
    path: 'rev-manifest.json',
    merge: false
  }, options)

  let firstFileBase = null;
  let manifest = {};

  console.log( 'inside manifest', opts )
}
