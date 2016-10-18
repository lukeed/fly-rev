'use strict';

const p = require('path');
const revHash = require('rev-hash');
const sortKeys = require('sort-keys');

const IGNORE = ['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot'];
let MANIFEST = {}; // reset on call
let FILENAME;
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
		FILENAME = opts.file;
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
			MANIFEST[p.join(dir, file.orig)] = p.join(dir, file.base);
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
	this.revReplace = function (opts) {
		opts = assign({}, {dirname: null, ignores: ignores}, opts);

		if (!opts.dirname) {
			return this.emit('plugin_error', {
				plugin: 'fly-rev',
				error: 'A `dirname` value must be provided in order to use `revReplace`!'
			});
		}

		var dir = path.join(this.root, opts.dirname);

		// set up a debounced listener, this registers BEFORE `fly.filter()` loops
		return this.on('rev_manifest', debounce(function (contents) {
			// get all files within `opts.dirname`
			var files = getFiles(dir, FILENAME);

			// manfest obj keys = original paths
			var keys = Object.keys(contents).map(function (key) {
				// Escape safe characters
				return key.replace(/([[^$.|?*+(){}\\])/g, '\\$1');
			}).join('|');

			var rgx = new RegExp(keys, 'g');

			files.forEach(function (file) {
				if (opts.ignores.indexOf(path.extname(file)) === -1) {
					// not an ignored extension, replace the original path with the hashed version
					var data = fs.readFileSync(file).toString().replace(rgx, function (key) {
						return contents[key];
					});

					// write the change
					write(file, data);
				}
			});
		}, 100));
	};
};

/**
 * Read all files from a Directory, excluding the `rev-manifest.json` itself
 * @param  {String} baseDir
 * @param  {String} maniPath
 * @return {Array}
 */
function getFiles(baseDir, maniPath) {
	var output = [];

	function parser(dir) {
		var items = fs.readdirSync(dir);

		items.forEach(function (item) {
			var fp = path.join(dir, item);
			var stats = fs.statSync(fp);

			if (stats.isDirectory()) {
				return parser(fp);
			} else if (stats.isFile() && item !== maniPath) {
				output.push(fp);
			}
		});
	}

	parser(baseDir);

	return output;
}
