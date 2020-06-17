const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const rollup = require('gulp-better-rollup');
const {terser} = require('rollup-plugin-terser');
const del = require('del');
const ghpages = require('gh-pages');

const config = {
  src: './src',
  build: './build'
};

const copy = () => {
  return gulp.src([
    `${config.src}/style/**/*`,
    `${config.src}/index.html`,
  ], {
    base: config.src
  })
    .pipe(gulp.dest(config.build));
};

const js = () => {
  return gulp.src(`${config.src}/js/index.js`)
    .pipe(rollup(
      {
        plugins: [terser()]
      },
      {
        format: 'iife',
        file: 'bundle.js'
      }))
    .pipe(gulp.dest(config.build));
};

const clean = () => {
  return del(config.build);
};

const bundle = async () => {
  return gulp.series(
    clean,
    gulp.parallel(copy, js)
  )();
};

const sync = () => {
  browserSync.init({
    server: config.build,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(`${config.src}/js/**/*.js`, gulp.series(bundle));
  gulp.watch(`${config.src}/**/*.{html,css}`, gulp.series(bundle));
  gulp.watch(`${config.src}/**/*.*`).on('change', browserSync.reload);
};

const publish = () => {
  return ghpages.publish('./build', function (err) {
  });
};

module.exports = {
  sync,
  bundle,
  publish
};
