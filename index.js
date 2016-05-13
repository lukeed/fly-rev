var fs = require('fs');
var path = require('path');
var revHash = require('rev-hash');
var debounce = require('debounce');
var sortKeys = require('sort-keys');
var assign = require('object-assign');
var write = require('safe-write-file');

var MANIFEST = {}; // reset on call
var FILENAME = 'rev-manifest.json';

var ignores = ['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot'];

module.exports = function () {
	/**
	 * Create new hashed file names based on contents
	 */
	this.filter('rev', function (data, opts) {
		// overwrite default opt values
		opts = assign({}, {strip: '', ignores: ignores}, opts);

		// if this file's extension matches `ignores`, exit early
		if (opts.ignores.indexOf(opts.file.ext) > -1) {
			return data;
		}

		var hash = revHash(data);
		var prev = opts.file.name;
		var next = [prev, hash].join('-');

		// strip a string from the `file.dir` path
		if (opts.strip.length) {
			var rgx = new RegExp(opts.strip, 'g');
			var dir = path.normalize(opts.file.dir.replace(rgx, path.sep));
			opts.file.dir = dir.charAt(0) === path.sep ? dir.substr(1) : dir;
		}

		// save original path
		prev = path.format(opts.file);

		// rename the original file
		opts.file.name = next;
		opts.file.base = next.concat(opts.file.ext);

		// add pairing to manifest
		next = path.format(opts.file);
		MANIFEST[prev] = next;

		// emit event for `revManifest` & `revReplace` listener
		this.emit('rev_manifest', MANIFEST);

		return data;
	});

	/**
	 * Write the manifest file
	 */
	this.revManifest = function (opts) {
		opts = assign({}, {dirname: null, filename: FILENAME}, opts);

		if (!opts.dirname) {
			return this.emit('plugin_error', {
				plugin: 'fly-rev',
				error: 'A `dirname` value must be provided in order to use `revManifest`!'
			});
		}

		FILENAME = opts.filename;
		var filepath = path.join(this.root, opts.dirname, FILENAME);

		return this.on('rev_manifest', debounce(function (contents) {
			// alphabetically sort
			MANIFEST = sortKeys(contents);
			// write to the manifest file
			write(filepath, JSON.stringify(MANIFEST, false, '  '));
		}, 100));
	};

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

		// set up a debounced listener, this registers BEFORE `fly.filter()` loops
		return this.on('rev_manifest', debounce(function (contents) {
			// get all files within `opts.dirname`
			var files = getFiles(opts.dirname, FILENAME);

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
