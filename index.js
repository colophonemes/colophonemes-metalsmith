var Metalsmith = require('metalsmith');
// templating
var markdown = require('metalsmith-markdown');
var templates  = require('metalsmith-templates');
var moment = require('moment');
var typogr = require('typogr');
// metadata and structure
var ignore      = require('metalsmith-ignore');
var branch  = require('metalsmith-branch');
var collections  = require('metalsmith-collections');
var permalinks  = require('metalsmith-permalinks');
var relative = require('metalsmith-relative');
var excerpts = require('metalsmith-excerpts');
// static file compilation
var sass  = require('metalsmith-sass');
var concat = require('metalsmith-concat');
var uglify = require('metalsmith-uglify');
var autoprefixer = require('metalsmith-autoprefixer');
var uncss = require('metalsmith-uncss');
var cleanCSS = require('metalsmith-clean-css');
var autoprefixer = require('metalsmith-autoprefixer');
// utility
var debug = require('metalsmith-debug');
var watch = require('metalsmith-watch');
var serve = require('metalsmith-serve');
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

// TEMPLATING HELPER
var addTemplate = function(config) {
    return function(files, metalsmith, done) {
    	var collections, collection;
        for (var file in files) {
        	collections = files[file].collection;
            for (var i = 0; i < collections.length; i++) {
            	collection = collections[i];
	            if (Object.keys(config).indexOf(collection)!==-1) {
	                var _f = files[file];
	                if (!_f.template) {
	                    _f.template = config[collection].template;
	                }
	                break;
	            }
            }
        }
        done();
    };
};

// LOG FILES
var logFilesMap = function(files, metalsmith, done) {
	Object.keys(files).forEach(function (file) {
		var fileObject = files[file];
		console.log(">> ", file);
		//console.log(">> ", fileObject);
	});
	done();
};

// ENVIRONMENT VARS
var ENVIRONMENT = process.env.ENV ? process.env.ENV : 'development';
console.log('ENVIRONMENT:',ENVIRONMENT)

var colophonemes = new Metalsmith(__dirname);

colophonemes
	.source('./src')
	.destination('./dest')
	.use(debug())
	.use(ignore([
		'drafts/*',
		'**/.DS_Store',
		'styles/partials'
	]))
	.use(bower)
	// Set up some metadata
	.use(collections({
		pages: {
			pattern: 'content/pages/*.md',
			sortBy: 'menuOrder',
			metadata: {
				singular: 'page',
				template: 'page.jade'
			}
		},
		posts: {
			pattern: 'content/posts/*.md',
			sortBy: 'date',
			reverse: true,
			metadata: {
				singular: 'post',
				template: 'blog.jade'
			}
		}
	}))
	.use(relative())
	// Build HTML files
	.use(markdown({
		highlight: function (code,lang) {
		    return require('highlight.js').highlight(lang,code).value;
		}
	}))
	.use(
		branch('content/pages/index*')
		.use(
			permalinks({
				pattern: './',
				relative: false				
			})
		)
	)	
	.use(
		branch('content/pages/!(index*)')
		.use(
			permalinks({
				pattern: ':title',
				relative: false				
			})
		)
	)
	.use(
		branch('content/posts/**')
		.use(
			permalinks({
				pattern: ':collection/:title',
				relative: false				
			})
		)
	)
	.use(excerpts())
	.use(addTemplate({
		posts: {
			collection: 'posts',
			template: 'post.jade',
		},
		pages: {
			collection: 'pages',
			template: 'page.jade'
		}
	}))
	.use(templates({
		engine:'jade',
		pretty: '\t',
		moment: moment,
		typogr: typogr
	}))
	// Build Javascript
	.use(concat({
		files: 'scripts/**/*.js',
		output: 'scripts/app.js'
	}))
	.use(uglify({
		removeOriginal: true
	}))
	// Build CSS
	.use(sass())
	.use(concat({
		files: 'styles/**/*.css',
		output: 'styles/app.min.css'
	}))	
	.use(uncss({
		basepath: 'styles',
		css: ['app.min.css'],
		output: 'app.min.css',
		removeOriginal: true,
		uncss: {
			ignore: ['.collapse.in','.collapsing','.container'],
			media: ['(min-width: 480px)','(min-width: 768px)','(min-width: 992px)','(min-width: 1200px)']
		}
	}))
	.use(cleanCSS())
	colophonemes.use(logFilesMap)
	;

	// stuff to only do in development
	if(ENVIRONMENT==='development'){
		colophonemes.use(serve());
	}

	// Run build
	colophonemes.build(function(err,files){
		if(err){
			console.log('Errors:');
			console.log(err);
		}
		if(files){
			console.log('Build OK!');
		}
	} )
	;