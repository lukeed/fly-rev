'use strict';

const join = require('path').join;
const test = require('tape').test;
const Fly = require('fly');

const dir = join(__dirname, 'fixtures');
const tmp = join(__dirname, 'tmp');
const hash = '2842ed45c6';

const fly = new Fly({
	plugins: [{
		func: require('../')
	}],
	tasks: {
		a: function * (o) {
			const t = o.val;
			yield this.source(`${dir}/*`).rev().target(tmp);
			t.true('rev' in fly, 'attach `rev()` plugin to fly');
			t.false(yield this.$.find(`${tmp}/a.js`), 'rename the file');
			t.true(yield this.$.find(`${tmp}/a-${hash}.js`), 'generate content-based hash');
			t.true(yield this.$.find(`${tmp}/b.svg`), 'ignore matching `opts.ignore` file types');
			yield this.clear(tmp);
		},
		b: function * (o) {
			const t = o.val;
			yield this.source(`${dir}/*`).rev().revManifest({dest: tmp}).target(tmp);
			t.true('revManifest' in fly, 'attach `revManifest()` plugin to fly');
			const file = yield this.$.read(`${tmp}/rev-manifest.json`, 'utf8');
			t.true(file, 'create & place the `rev-manifest.json` file in `opts.dest`');
			const data = JSON.parse(file);
			const keys = Object.keys(data);
			t.equal(keys.length, 1, 'only contains revved files');
			t.equal(keys[0], 'test/fixtures/a.js', 'keys are original files\' paths');
			t.equal(data[keys[0]], `test/fixtures/a-${hash}.js`, 'values are revved files\' paths');
			yield this.clear(tmp);
		},
		c: function * (o) {
			const t = o.val;
			yield this.source(`${dir}/*`).rev().revManifest({trim: 'test'}).target(`${tmp}/sub`);
			const file = yield this.$.read(`${this.root}/rev-manifest.json`, 'utf8');
			t.true(file, 'create & place the `rev-manifest.json` file in `this.root` (default)');
			const data = JSON.parse(file);
			const keys = Object.keys(data);
			t.equal(keys[0], 'fixtures/a.js', 'pass `opts.trim` a string; modifies keys');
			t.equal(data[keys[0]], `fixtures/a-${hash}.js`, 'pass `opts.trim` a string; modifies values');
			yield this.clear([tmp, `${this.root}/rev-manifest.json`]);
		},
		d: function * (o) {
			const t = o.val;
			yield this.source(`${dir}/*`).rev()
				.revManifest({dest: tmp, trim: s => s.replace(/test\/fixtures/i, 'sub')})
				.target(`${tmp}/sub`);
			const file = yield this.$.read(`${tmp}/rev-manifest.json`, 'utf8');
			t.true(file, 'create & place the `rev-manifest.json` file in `opts.dest`');
			const data = JSON.parse(file);
			const keys = Object.keys(data);
			t.equal(keys[0], 'sub/a.js', 'pass `opts.trim` a function; modifies keys');
			t.equal(data[keys[0]], `sub/a-${hash}.js`, 'pass `opts.trim` a function; modifies values');
		},
		e: function * (o) {
			const t = o.val;
			yield this.clear(tmp);
			yield this.source(`${dir}/*`)
				.rev()
				.revManifest({dest: tmp})
				.revReplace({ignores: []})
				.target(tmp);
			t.true('revReplace' in fly, 'attach `revReplace()` plugin to fly');
			const svg = yield this.$.read(`${tmp}/b.svg`, 'utf8');
			const rgx = new RegExp('test/fixtures/a-2842ed45c6.js', 'i');
			t.true(rgx.test(svg), 'replace the original file path');
			yield this.clear(tmp);
		}
	}
});

test('fly-rev: rev()', t => {
	t.plan(4);
	fly.start('a', {val: t});
});

test('fly-rev: revManifest()', t => {
	t.plan(11);
	fly.serial(['b', 'c', 'd'], {val: t});
});

test('fly-rev: revReplace()', t => {
	t.plan(2);
	fly.start(['e'], {val: t});
});
