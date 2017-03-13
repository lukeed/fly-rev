'use strict';

const p = require('path');
const revHash = require('rev-hash');
const sortKeys = require('sort-keys');

const IGNORE = ['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot'];
let MANIFEST;
let FILEPATH;

module.exports = function (fly) {
	/**
	 * Create new hashed file names based on contents
	 */
	fly.plugin('rev', {}, function * (file, opts) {
		// overwrite default opt values
		opts = Object.assign({ignores: IGNORE}, opts);

		// bypass dirs or empty files
		if (!file.data) {
			return;
		}

		const ext = p.extname(file.base);
		// if this file's extension matches `ignores`, exit early
		if (!ext || opts.ignores.indexOf(ext) !== -1) {
			return;
		}

		file.orig = file.base;
		file.hash = revHash(file.data);

		// find first occurence of '.', NOT including first char
		const idx = file.base.indexOf('.', 1);

		// change filename; append hash to base name
		file.base = file.base.substr(0, idx).concat('-', file.hash, file.base.substr(idx));
	});

	/**
	 * Write the manifest file
	 */
	fly.plugin('revManifest', {every: 0}, function * (files, opts) {
		MANIFEST = {}; // reset

		opts = Object.assign({
			sort: true,
			dest: this.root, // place file
			trim: '', // path to trim
			file: 'rev-manifest.json'
		}, opts);

		// update known values
		FILEPATH = p.resolve(opts.dest, opts.file);

		// content to replace
		if (!opts.trim || typeof opts.trim === 'string') {
			const t = opts.trim;
			// create `replace` function
			opts.trim = str => str.replace(new RegExp(t, 'i'), '/');
		}

		for (const f of files) {
			// only if was revv'd
			if (!f.orig) continue;
			// strip a string from the `file.dir` path
			let dir = p.relative(this.root, f.dir);
			// apply `opts.trim` func
			dir = p.normalize(opts.trim(dir));
			// ensure no leading '/'
			dir = dir.charAt(0) === '/' ? dir.substr(1) : dir;
			// add pairing to manifest
			MANIFEST[p.join(dir, f.orig)] = p.join(dir, f.base);
		}

		// alphabetically sort
		if (opts.sort) {
			MANIFEST = sortKeys(MANIFEST);
		}

		// write the file
		yield this.$.write(FILEPATH, JSON.stringify(MANIFEST, false, '	'));
	});

	/**
	 * Read all files within a `dir` & Update to latest filenames
	 */
	fly.plugin('revReplace', {every: 0}, function * (files, opts) {
		opts = Object.assign({ignores: IGNORE}, opts);

		// get original manifest paths; escape safe characters
		const keys = Object.keys(MANIFEST).map(k => k.replace(/([[^$.|?*+(){}\\])/g, '\\$1')).join('|');
		const rgx = new RegExp(keys, 'gi');

		for (const f of files) {
			const ext = p.extname(f.base);
			// only if not in `ignores`
			if (!ext || opts.ignores.indexOf(ext) !== -1) continue;
			// replace orig with rev'd && write it
			const d = f.data.toString().replace(rgx, k => MANIFEST[k]);
			f.data = new Buffer(d);
		}
	});
};
