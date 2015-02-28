var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var templates  = require('metalsmith-templates');
var collections  = require('metalsmith-collections');
var permalinks  = require('metalsmith-permalinks');
var stylus  = require('metalsmith-stylus');
var sass  = require('metalsmith-sass');
var uglify = require('metalsmith-uglify');
var concat = require('metalsmith-concat');
var ignore      = require('metalsmith-ignore');
var uncss = require('metalsmith-uncss');
var cleanCSS = require('metalsmith-clean-css');
var autoprefixer = require('metalsmith-autoprefixer');
var debug = require('metalsmith-debug');
var relative = require('metalsmith-relative');
var watch = require('metalsmith-watch');
var serve = require('metalsmith-serve');
var moment = require('moment');
var typogr = require('typogr');
// BOWER MANAGEMENT
var fs = require('fs');
var path = require('path');
var bowerFiles = require('bower-files')({
					overrides: {
						'bootstrap-sass-official': {
							"main": [
								"./styles/bootstrap.scss",
								"assets/fonts/bootstrap/glyphicons-halflings-regular.eot",
								"assets/fonts/bootstrap/glyphicons-halflings-regular.svg",
								"assets/fonts/bootstrap/glyphicons-halflings-regular.ttf",
								"assets/fonts/bootstrap/glyphicons-halflings-regular.woff",
								"assets/fonts/bootstrap/glyphicons-halflings-regular.woff2",
								"assets/javascripts/bootstrap/collapse.js",
								"assets/javascripts/bootstrap/dropdown.js",
								"assets/javascripts/bootstrap/transition.js",
							],
						},
						'bootswatch-sass': {
							main: './styles/bootstrap.scss',
						},
						'modernizr': {
							main: '../bower_componenents/modernizr/modernizr.js'
						}
					}
				});
var bower = function(files, metalsmith, done) {
  var include;
  include = function(root, included) {
	var contents, file, i, len, results;
	results = [];
	for (i = 0, len = included.length; i < len; i++) {
	  file = included[i];
	  contents = fs.readFileSync(file);
	  results.push(files[root + "/" + (path.basename(file))] = {
		contents: contents
	  });
	}
	return results;
  };
  include('styles', bowerFiles.ext('css').files);
  include('styles', bowerFiles.ext('scss').files);
  include('scripts', bowerFiles.ext('js').files);
  include('fonts', bowerFiles.ext(['eot', 'otf', 'ttf', 'woff']).files);
  return done();
};

// LOG FILES
var logFilesMap = function(files, metalsmith, done) {
	Object.keys(files).forEach(function (file) {
		var fileObject = files[file];
		console.log(">> ", file);
	});
	done();
};


Metalsmith(__dirname)
	.source('./src')
	.use(bower)
	.destination('./dest')
	.use(debug())
	.use(ignore([
		'drafts/*',
		'**/.DS_Store'
	]))
	.use(collections({
		pages: {
			pattern: 'content/pages/*.md',
			sortBy: 'menuOrder',
			metadata: {
				singular: 'page'
			}
		},
		posts: {
			pattern: 'content/posts/*.md',
			sortBy: 'date',
			reverse: true,
			metadata: {
				singular: 'post'
			}
		}
	}))
	.use(markdown())
	.use(permalinks({
		pattern: ':collection/:title',
		relative: false
	}))
	.use(relative())
	.use(templates({
		engine:'jade',
		pretty: '\t',
		moment: moment,
		typogr: typogr
	}))
	.use(logFilesMap)
	.use(concat({
		files: 'scripts/**/*.js',
		output: 'scripts/app.js'
	}))
	.use(uglify({
		removeOriginal: true
	}))
	.use(sass())
	.use(uncss({
		css: ['styles/bootstrap.css','styles/main.css'],
		output: 'styles/app.min.css',
		removeOriginal: true,
	}))
	.use(cleanCSS())
	.use(serve())
	.build(function(err,files){
		if(err){
			console.log('Errors:');
			console.log(err);
		}
		if(files){
			console.log('Build OK!');
		}
	} )
	;