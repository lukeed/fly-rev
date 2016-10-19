'use strict';

const p = require('path');
const revHash = require('rev-hash');
const sortKeys = require('sort-keys');

const IGNORE = ['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot'];
let MANIFEST = {}; // reset on call
let FILEPATH;

module.exports = function () {
	/**
	 * Create new hashed file names based on contents
	 */
	this.plugin('rev', {}, function * (file, opts) {
		// overwrite default opt values
		opts = Object.assign({}, {strip: '', ignores: IGNORE}, opts);

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
	this.plugin('revManifest', {every: 0}, function * (files, opts) {
		opts = Object.assign({
			base: '', // path to trim
			dest: this.root, // place file
			sort: true,
			file: 'rev-manifest.json'
		}, opts);

		// update known values
		FILEPATH = p.resolve(opts.dest, opts.file);

		// content to replace; default to `this.root`
		opts.base = p.normalize(p.resolve(opts.base || ''));
		const rgx = new RegExp(opts.base, 'i');

		for (const f of files) {
			// strip a string from the `file.dir` path
			let dir = p.normalize(f.dir.replace(rgx, '/'));
			dir = dir.charAt(0) === '/' ? dir.substr(1) : dir;
			console.log('dir', dir);
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
	this.plugin('revReplace', {every: 0}, function * (_, opts) {
		opts = Object.assign({dir: '', ignores: IGNORE}, opts);

		if (!opts.dir) {
			return this.emit('plugin_error', {
				plugin: 'fly-rev',
				error: 'A `dir` must be specified in order to use `revReplace`!'
			});
		}

		opts.dir = p.resolve(opts.dir);

		// get all files within `opts.dir`
		const files = yield this.$.expand(opts.dir, {ignore: FILEPATH});

		// get original manifest paths; escape safe characters
		const keys = Object.keys(MANIFEST).map(k => k.replace(/([[^$.|?*+(){}\\])/g, '\\$1')).join('|');
		const rgx = new RegExp(keys, 'gi');

		for (const f of files) {
			const ext = p.extname(f);
			// if this file's extension is not in `ignores`, continue
			if (ext && opts.ignores.indexOf(ext) === -1) {
				const data = yield this.$.read(f);
				// replace orig with rev'd && write it
				yield this.$.write(f, data.toString().replace(rgx, k => MANIFEST[k]));
			}
		}
	});
};
