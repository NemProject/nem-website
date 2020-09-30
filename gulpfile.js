var $        = require('gulp-load-plugins')();
var argv     = require('yargs').argv;
var browser  = require('browser-sync');
var gulp     = require('gulp');
var panini   = require('panini');
var rimraf   = require('rimraf');
var sequence = require('run-sequence');
var sherpa   = require('style-sherpa');
var i18n     = require('gulp-i18n-gspreadsheet');
var config   = require('./config.json');

// Check for --production flag
var isProduction = !!(argv.production);
// var isProduction = true;

// Port to use for the development server.
var PORT = 8765;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  assets: [
    'src/assets/**/*',
    '!src/assets/{!img,js,scss}/**/*'
  ],
  sass: [
    'bower_components/foundation-sites/scss',
    'bower_components/motion-ui/src/',
    'bower_components/font-awesome/scss'
  ],
  javascript: [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/what-input/what-input.js',
    'bower_components/foundation-sites/js/foundation.core.js',
    'bower_components/foundation-sites/js/foundation.util.*.js',
    // Paths to individual JS components defined below
    'bower_components/foundation-sites/js/foundation.abide.js',
    'bower_components/foundation-sites/js/foundation.accordion.js',
    'bower_components/foundation-sites/js/foundation.accordionMenu.js',
    'bower_components/foundation-sites/js/foundation.drilldown.js',
    'bower_components/foundation-sites/js/foundation.dropdown.js',
    'bower_components/foundation-sites/js/foundation.dropdownMenu.js',
    'bower_components/foundation-sites/js/foundation.equalizer.js',
    'bower_components/foundation-sites/js/foundation.interchange.js',
    // 'bower_components/foundation-sites/js/foundation.magellan.js',
    'bower_components/foundation-sites/js/foundation.offcanvas.js',
    'bower_components/foundation-sites/js/foundation.orbit.js',
    'bower_components/foundation-sites/js/foundation.responsiveMenu.js',
    'bower_components/foundation-sites/js/foundation.responsiveToggle.js',
    'bower_components/foundation-sites/js/foundation.reveal.js',
    'bower_components/foundation-sites/js/foundation.slider.js',
    'bower_components/foundation-sites/js/foundation.sticky.js',
    'bower_components/foundation-sites/js/foundation.tabs.js',
    'bower_components/foundation-sites/js/foundation.toggler.js',
    'bower_components/foundation-sites/js/foundation.tooltip.js',
    // Path to non-foundation JS components
    // 'bower_components/twitter-fetcher/js/twitterFetcher.js',
    'bower_components/i18next/i18next.js',
    // 'bower_components/smooth-scroll/dist/js/smooth-scroll.js',
    // 'bower_components/jquery-sticky/jquery.sticky.js',

    // 'bower_components/gumshoe/dist/js/gumshoe.js',
    // 'bower_components/skrollr-stylesheets/src/skrollr.stylesheets.js',
    // 'bower_components/skrollr/src/skrollr.js',
    // 'bower_components/skrollr-menu/src/skrollr.menu.js',
    'bower_components/svg-injector/svg-injector.js',
    'bower_components/numeral/numeral.js',
    'bower_components/slick-carousel/slick/slick.js',

    'src/assets/js/!(app.js)**/*.js',
    'src/assets/js/app.js'
  ]
};

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('dist', done);
});

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function() {
  gulp.src(PATHS.assets)
    .pipe(gulp.dest('dist/assets'));
});

// Copy page templates into finished HTML files
gulp.task('pages', function() {
  gulp.src('src/pages/**/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: 'src/pages/',
      layouts: 'src/layouts/',
      partials: 'src/partials/',
      data: 'src/data/',
      helpers: 'src/helpers/'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('pages:reset', function(cb) {
  panini.refresh();
  gulp.run('pages');
  cb();
});

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  var uncss = $.if(isProduction, $.uncss({
    html: ['src/**/*.html'],
    ignore: [
      new RegExp('^meta\..*'),
      new RegExp('^\.is-.*')
    ]
  }));

  var cleancss = $.if(isProduction, $.cleanCss());

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass
    })
    .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    // removed compressing css, it was causing bugs in navbar
    // .pipe(uncss)
    .pipe(cleancss)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/css'));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});

// Copy fontawesome font icons to dist folder
gulp.task('fonts', function() {
  gulp.src('bower_components/font-awesome/fonts/**.*')
    .pipe(gulp.dest('dist/assets/fonts/'));
});

// place needed pdf's at root level of dist
gulp.task('pdfs', function() {
  gulp.src('src/assets/pdfs/**.*')
    .pipe(gulp.dest('dist'));
});

gulp.task('nccCopy', ['clean'], function () {
    return gulp.src(['src/ncc/**/*'], {
      base: 'src'
    }).pipe(gulp.dest('dist'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  var imagemin = $.if(isProduction, $.imagemin({
    progressive: true
  }));

  return gulp.src('src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('dist/assets/img'));
});

// Build the "dist" folder by running all of the above tasks
gulp.task('build', function(done) {
  sequence('clean', ['translate', 'pages', 'sass', 'javascript', 'images', 'copy', 'fonts', 'pdfs', 'nccCopy'], done);
});

// google spreadsheet i18n.
// Pulls columns from gspreadsheet and puts each column in seperate json file.
gulp.task('translate', function() {
  var document_key = '1dCO6KpecxgB577Fd0Gk0W-h9NuwTwPyDB7lysiNSZ34';
  if(!isProduction && config.document_key !== undefined) {
    document_key = (config.document_key);
  }
  gulp.src('src/*')
    .pipe(i18n({
      private_key_id: (config.private_key_id),
      private_key: (config.private_key),
      client_email: (config.client_email),
      client_id: (config.client_id),
      type: 'service_account',
      document_key: document_key,
      default_locale: 'en',
      write_default_translations: 'true',
      key_column: 'key',
      ext: '.json',
      output_dir: 'locales/'
    }))
    .pipe(gulp.dest('dist/assets/'));
});

// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  browser.init({
    server: 'dist', port: PORT
  });
});


gulp.task('default', ['build', 'server'], function() {
  gulp.watch(PATHS.assets, ['copy', browser.reload]);
  gulp.watch(['src/pages/**/*.html'], ['pages', browser.reload]);
  gulp.watch(['src/{layouts,partials}/**/*.html'], ['pages:reset', browser.reload]);
  gulp.watch(['src/assets/scss/**/*.scss'], ['sass', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript', browser.reload]);
  gulp.watch(['src/assets/img/**/*'], ['images', browser.reload]);
});
