'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');

const config = {
  src: './src',
  build: './build'
};

gulp.task('browserSync', () => {
  browserSync.init({
    server: config.src,
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch(`${config.src}/js/**/*.js`, gulp.series('bundle'));
  gulp.watch(`${config.src}/**/*.{html,css}`, gulp.series('bundle'));
  gulp.watch(`${config.src}/**/*.*`).on('change', browserSync.reload);
});

gulp.task('bundle', () => {
  return rollup({
    input: `${config.src}/js/index.js`,
    format: 'iife',
    sourcemap: false
  })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(`${config.src}/build`));
});
