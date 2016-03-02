var fs = require('fs');
var revHash = require('rev-hash');
var revPath = require('rev-path');
var sortKeys = require('sort-keys');
var assign = require('object-assign');

module.exports = function () {
	var manifest = {}; // reset on call

	this.rev = function (options) {
		// overwrite default opt values
		options = assign({
			base: '.',
			replace: false,
			path: 'rev-manifest.json'
		}, options);

		// handle all this.source(...) files
		this.unwrap(function (files) {
			return files.map(function (name) {
				var revved = hashify(name);

				// rename the original file
				fs.renameSync(name, revved);

				// strip the base from path
				name = relPath(options.base, name);
				revved = relPath(options.base, revved);

				// add pairing to manifest
				manifest[name] = revved;
			});
		}).then(function () {
			manifest = sortKeys(manifest);

			var data = JSON.stringify(manifest, false, '  ');

			fs.writeFileSync(options.base + '/' + options.path, data);

			if (options.replace) {
				return replacePaths(options.base, options.path, manifest);
			}
		});
	};
};

function hashify(name) {
	var buff = fs.readFileSync(name);
	var hash = revHash(buff);

	var idx = name.indexOf('.');
	var extn = name.slice(idx);

	var revved = (idx === -1) ? name : name.slice(0, idx);

	return revPath(revved, hash) + (idx === -1 ? '' : extn);
}

function relPath(base, path) {
	if (path.indexOf(base) !== 0) {
		return path.replace(/\\/g, '/');
	}

	var newPath = path.substr(base.length).replace(/\\/g, '/');

	if (newPath[0] === '/') {
		return newPath.substr(1);
	}

	return newPath;
}

function getFiles(base, manifest) {
	var output = [];

	function parser(dir) {
		var items = fs.readdirSync(dir);

		items.forEach(item => {
			var fullpath = `${dir}/${item}`;
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

	files.forEach(function * (file) {
		var data = fs.readFileSync(file, 'utf8').replace(rgxp, function (key) {
			return content[key];
		});

		fs.writeFile(file, data);
	});
}
