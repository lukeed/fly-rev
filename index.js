const read = require("fs").readFileSync
const assign = require("object-assign")
const revHash = require("rev-hash")
const revPath = require("rev-path")
const modName = require("modify-filename")
// const sortKeys = require("sort-keys")

function generateName (filename) {
  const buffer = read(filename)
  const hash = revHash(buffer)
  console.log( "inside gen", typeof file )
  return file
  // return modName(file, (name, extn) => {
  //   console.log( "inside modName:", name, extn )
  //   const idx = name.indexOf(".")

  //   name = idx === -1 ? revPath(name, hash) : revPath(name.slice(0, idx), hash) + name.slice(idx)

  //   return name + extn
  // })
}

export default function () {
  let manifest = {}
  this.rev = function (options) {
    this.unwrap(files => files.map(name => {
      const buff = read(name)
      const hash = revHash(buff)
      const idx = name.indexOf(".")
      const extn = name.slice(idx)

      let revved = (idx === -1) ? name : name.slice(0, idx)
      revved = revPath(revved, hash) + (idx === -1 ? '' : extn)

      manifest[name] = revved
    })).then(() => {
      console.log( manifest );
    })

    // console.log( 'OUTISDE', manifest );

      // console.log( filename, idx )
      // console.log( filename )
      // console.log( hash, file )
    return this
  }
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
