var path = require('path');
var revHash = require('rev-hash');
var sortKeys = require('sort-keys');
var assign = require('object-assign');
var write = require('safe-write-file');

var defaults = {
	base: '',
	replace: false,
	filename: 'rev-manifest.json'
};

module.exports = function () {
	var manifest = {}; // reset on call

	this.filter('rev', function (data, opts) {
		// overwrite default opt values
		opts = assign({}, defaults, opts);

		var hash = revHash(data);
		var prev = opts.file.name;
		var next = [prev, hash].join('-');

		// rename the original file
		opts.file.name = next;
		opts.file.base = next.concat(opts.file.ext);

		// strip the `base` from the `dir` path
		if (opts.base.length) {
			var rgx = new RegExp(opts.base, 'g');
			var dir = path.normalize(opts.file.dir.replace(rgx, path.sep));
			opts.file.dir = dir.charAt(0) === path.sep ? dir.substr(1) : dir;
		}

		// add pairing to manifest
		prev = path.format(opts.file);
		next = path.format(opts.file);
		manifest[prev] = next;
		// alphabetically sort
		manifest = sortKeys(manifest);

		// write to the manifest
		var dest = path.join(this.root, opts.base, opts.filename);
		write(dest, JSON.stringify(manifest, false, '  '));

		// if (options.replace) {
		// 			replacePaths(options.base, options.path, manifest);
		// 		}

		return data;
	});
};

/*
function getFiles(base, manifest) {
	var output = [];

	function parser(dir) {
		var items = fs.readdirSync(dir);

		items.forEach(function (item) {
			var fullpath = dir + '/' + item;
			var stats = fs.statSync(fullpath);

			if (stats.isDirectory()) {
				return parser(fullpath);
			} else if (stats.isFile() && item !== manifest) {
				output.push(fullpath);
			}
		});
	}

	parser(base);

	return output;
}

function replacePaths(base, manifest, content) {
	var files = getFiles(base, manifest);
	var keys = Object.keys(content);

	// Escape safe characters
	for (var key of keys) {
		key = key.replace(/([[^$.|?*+(){}\\])/g, '\\$1');
	}

	var rgxp = new RegExp(keys.join('|'), 'g');
	var ignore = ['.png', 'jpg', '.jpeg', '.svg', '.gif', '.woff', '.ttf', '.eot'];

	files.forEach(function (file) {
		if (ignore.indexOf(extname(file)) === -1) {
			var data = fs.readFileSync(file).toString().replace(rgxp, function (key) {
				return content[key];
			});

			fs.writeFileSync(file, data);
		}
	});
}
*/
