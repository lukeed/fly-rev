<div align="center">
  <a href="http://github.com/flyjs/fly">
    <img width=200px  src="https://cloud.githubusercontent.com/assets/8317250/8733685/0be81080-2c40-11e5-98d2-c634f076ccd7.png">
  </a>
</div>

> [Rev](https://github.com/lukeed/fly-rev) plugin for _[Fly][fly]_.

[![][fly-badge]][fly]
[![npm package][npm-ver-link]][releases]
[![][dl-badge]][npm-pkg-link]
[![][travis-badge]][travis-link]
[![][mit-badge]][mit]

## Usage

### Install
```a
npm install -D fly-rev
```

### Options

#### base
Type: `string`

Default: `.` (project root)

The base directory where your assets reside. This is also where your `rev-manifest.json` file will be placed.

#### path
Type: `string`

Default: `rev-manifest.json`

The filename of your manifest file.

#### replace
Type: `boolean`

Default: false

If true, will browse all files within `options.base` and rewrite occurrences of filenames that were renamed.

### Example

`fly-rev` must be contained within its own task. This is because it does not allow method chaining, as it handles its own endpoint.

It is also suggested that this `rev` task be the last step in your build process.

```js
export default function* {
  // ...
  this.start('rev') // call the rev task
}

export function* rev() {
  const src = ['scripts', 'styles', 'images'].map(dir => {
    return `dist/${dir}/**/*`
  })
  return this.source(src).rev({
    base: 'dist',
    replace: true
  })
}
```

## License

[MIT][mit] © [lukee][author] et [al][contributors]


[mit]:          http://opensource.org/licenses/MIT
[author]:       https://lukeed.com
[contributors]: https://github.com/lukeed/fly-rev/graphs/contributors
[releases]:     https://github.com/lukeed/fly-rev/releases
[fly]:          https://www.github.com/flyjs/fly
[fly-badge]:    https://img.shields.io/badge/fly-JS-05B3E1.svg?style=flat-square
[mit-badge]:    https://img.shields.io/badge/license-MIT-444444.svg?style=flat-square
[npm-pkg-link]: https://www.npmjs.org/package/fly-rev
[npm-ver-link]: https://img.shields.io/npm/v/fly-rev.svg?style=flat-square
[dl-badge]:     http://img.shields.io/npm/dm/fly-rev.svg?style=flat-square
[travis-link]:  https://travis-ci.org/lukeed/fly-rev
[travis-badge]: http://img.shields.io/travis/lukeed/fly-rev.svg?style=flat-square
