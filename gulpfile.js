'use strict';

// Gulp file to automate the various tasks

const { src, series, parallel, dest, task, watch } = require( 'gulp' );

let autoprefixer = require('gulp-autoprefixer'),
	browserSync = require('browser-sync').create(),
	cleanCss = require('gulp-clean-css'),
	cache = require('gulp-cache'),
	concat = require('gulp-concat'),
	del = require('del'),
	npmDist = require('gulp-npm-dist'),
	postcss = require('gulp-postcss'),
	plumber = require('gulp-plumber'),
	sass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	replace = require('gulp-replace'),
	wait = require('gulp-wait');

// Define paths

var paths = {
	base: {
		node: 'node_modules'
	},
	dist: {
		base: 'dist',
		css: 'dist/assets/css',
		js: 'dist/assets/js',
		libs: 'dist/assets/libs',
		img: 'dist/assets/img'
	},
	src: {
		base: 'src',
		html: 'src/**/*.html',
		css: 'src/assets/css',
		js: 'src/assets/js',
		img: 'src/assets/img/**/*.+(png|jpg|gif|svg)',
		libs: 'src/assets/libs',
		resources: 'src/resources'
	}
}

// Compile SCSS

task('compile:scss', function(done) {
	return src(paths.src.resources + '/scss/**/*.scss')
    .pipe(plumber())
    .pipe(wait(500))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([require('postcss-flexbugs-fixes')]))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(dest(paths.src.css))
	.pipe(browserSync.reload({
		stream: true
	}));

	done();
});

// Minify CSS

task('minify:css', function(done) {
	return src(paths.src.css + '/*.css')
		.pipe(sourcemaps.init())
		.pipe(cleanCss())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(dest(paths.dist.css))
	done();
});

// Copy CSS

task('copy:css', function(done) {
	return src([
			paths.src.css + '/*.css',
			paths.src.css + '/*.css.map'
		])
		.pipe(dest(paths.dist.css))
	done();
});

// Concat JS

task('concat:js', function(done) {
	return src([
			paths.src.resources + '/js/license.js',
			paths.src.resources + '/js/core/init/*.js',
			paths.src.resources + '/js/core/custom/*.js',
			paths.src.resources + '/js/core/maps/*.js',
			paths.src.resources + '/js/core/libs/*.js',
			paths.src.resources + '/js/core/charts/*js'
		])
		.pipe(sourcemaps.init())
		.pipe(concat('quick-website.js'))
		.pipe(sourcemaps.write('./'))
		.pipe(dest(paths.src.js))
		.pipe(browserSync.reload({
			stream: true
		}));
	done();
});

// Minify js

task('minify:js', function(done) {
	return src(paths.src.js + '/*.js')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(dest(paths.dist.js))
	done();
});

// Copy JS

task('copy:js', function(done) {
	return src([
			paths.src.js + '/quick-website.js',
			paths.src.js + '/quick-website.js.map'
		])
		.pipe(dest(paths.dist.js))
	done();
});

// HTML

task('copy:html', function(done) {
	return src([
		paths.src.html,
		'!' + paths.src.base + '/docs/**/*'
	])
	.pipe(dest(paths.dist.base));

	done();
});

// Copy Libs

task('copy:libs', function(done) {
	return src(npmDist(), {
		base: paths.base.node
	})
	.pipe(dest(paths.dist.libs));

    done()
});

// Sync Libs - for the default task

task('sync:libs', function(done) {
	return src(npmDist(), {
		base: paths.base.node
	})
	.pipe(dest(paths.src.libs));

    done()
});

// Copy images

task('copy:images', function(done) {
	return src(paths.src.img)
		.pipe(dest(paths.dist.img))
	done();
});


// Clean

task('clean:dist', function(done) {
	return del([
		paths.dist.base
	]);
	done();
});

//  BrowserSync

// Initialize the browsersync

function browserSyncInit(done) {
	browserSync.init({
		server: {
			baseDir: './src'
		},
		port: 3000
	});
	done();
}

// BrowserSync Reload (callback)

function browserSyncReload(done) {
	browserSync.reload();
	done();
}

function watchFiles() {
	watch(paths.src.resources + '/scss/**/*.scss', series('compile:scss'));
	watch(paths.src.resources + '/js/**/*.js', series('concat:js'));
	watch(paths.src.html, browserSyncReload);
}

// Bundled tasks

task('js', series('concat:js', 'minify:js', 'copy:js'));
task('css', series('compile:scss', 'minify:css', 'copy:css'));
task('html', series('copy:html'));
task('assets', parallel('copy:libs', 'copy:images'));
task('browserSync', series(browserSyncInit, watchFiles));

// Build

task('build', series('clean:dist', 'css', 'js', 'html', 'assets'));

// Libs

task('libs', series('sync:libs'));

// Default

task('default', series('compile:scss', 'concat:js', 'browserSync'));
