<div align="center">
  <a href="http://github.com/flyjs/fly">
    <img width=200px  src="https://cloud.githubusercontent.com/assets/8317250/8733685/0be81080-2c40-11e5-98d2-c634f076ccd7.png">
  </a>
</div>

>Append a unique hash to filenames: `example.css` → `example-a6fhd136asf.css`

>May also rewrite occurrences of the filenames that were renamed.

[![][fly-badge]][fly]
[![npm package][npm-ver-link]][releases]
[![][dl-badge]][npm-pkg-link]
[![][travis-badge]][travis-link]

Version / hashify asset files for cache-busting.

Optionally create a `rev

## Install
```a
npm install fly-rev --save-dev
```

## Usage

The `rev()` task is the core method; thus is **required** for anything to occur.

Both `revManifest()` and `revReplace()` are optional, purely elective, plugins.

```javascript
export default function * () {
  yield this.source('app/**/*')
    .rev({
      strip: 'app',
      ignores: ['.html', '.jpg', '.png']
     })
    .revManifest({
      dirname: 'dist',
      filename: 'manifest-json'
    })
    .revReplace({
      dirname: 'dist',
      ignores: ['.php']
    })
    .target('dist');
}
```

## API

### rev()

Rename files by appending a unique hash, based on file contents.

#### strip

Type: `string` <br>
Default: `''`

A string to remove from the asset paths; usually the source directory name.

Example: 

```javascript
yield this.source('app/**/*').rev()
//=> produces "app/scripts/"
yield this.source('app/**/*').rev({strip: 'app'})
//=> produces "scripts/"
```

#### ignores

Type: `array` <br>
Default: `['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot']`

A list of file extensions to NOT rename.

### revManifest()

Create a manifest that maps old filenames to newly versioned filenames.

#### filename

Type: `string` <br>
Default: `'rev-manifest.json'`

The filename of the manifest to be created.

#### dirname

Type: `string` <br>
Default: `null` <br>
Required: `true`

The directory (relative to `root`) to place your `rev-manifest.json`. **Required!** 

### revReplace()

Update all references to versioned files within a given directory.

#### dirname

Type: `string` <br>
Default: `null` <br>
Required: `true`

The directory (relative to `root`) whose files are to be read & updated. **Required!** 

#### ignores

Type: `array` <br>
Default: `['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot']`

A list of file extensions that should not be read & updated.

## License

MIT © [Luke Edwards](https://lukeed.com)


[releases]:     https://github.com/lukeed/fly-rev/releases
[fly]:          https://www.github.com/flyjs/fly
[fly-badge]:    https://img.shields.io/badge/fly-JS-05B3E1.svg?style=flat-square
[mit-badge]:    https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[npm-pkg-link]: https://www.npmjs.org/package/fly-rev
[npm-ver-link]: https://img.shields.io/npm/v/fly-rev.svg?style=flat-square
[dl-badge]:     http://img.shields.io/npm/dm/fly-rev.svg?style=flat-square
[travis-link]:  https://travis-ci.org/lukeed/fly-rev
[travis-badge]: http://img.shields.io/travis/lukeed/fly-rev.svg?style=flat-square
