// import plugins
import gulp from 'gulp';

import sync from 'browser-sync';
import webpack from 'webpack-stream';
import postcss from 'gulp-postcss';
import pimport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import csso from 'postcss-csso';

import configWebpack from './webpack.config.js'


import htmlmin from 'gulp-htmlmin';

// directions
const TEST = 'test',
  DIST = 'dist',
  SRC = 'src';

// copy html files from SRC to TEST
const html = () => {
  return gulp
  .src(`${SRC}/*.html`)
  .pipe(gulp.dest(`${TEST}`))
  .pipe(sync.stream());
};

// copy styles from SRC to TEST with few modifications
const styles = () => {
  return (
    gulp
    .src(`${SRC}/styles/index.css`)
    // 'pimport' resolve path of an @import rule
    // 'autoprefixer' add or remove vendor prefixes like -webkit and -moz after checking the code
    .pipe(postcss([pimport, autoprefixer]))
    .pipe(gulp.dest(`${TEST}/styles`))
    .pipe(sync.stream())
  );
};

const imagesMain = (dir) => {
  return function images() {
    return gulp
    .src(`${SRC}/images/**/*`)
    .pipe(gulp.dest(`${dir}/images`))
    .pipe(sync.stream());
  };
};

const fontsMain = (dir) => {
  return function fonts() {
    return gulp
    .src(`${SRC}/fonts/**/*`)
    .pipe(gulp.dest(`${dir}/fonts`))
    .pipe(sync.stream());
  };
};

function setModeWebpack(mode) {
   configWebpack.mode = mode;
   return configWebpack;
}


// copy scripts and modify with babel
const scripts = () => {
  return gulp
  .src(`${SRC}/scripts/*.js`)
  .pipe(webpack(setModeWebpack('development')))
  .pipe(gulp.dest(`${TEST}/scripts`))
  .pipe(sync.stream());
};

// browser sync
const server = () => {
  sync.init({
    // more info https://browsersync.io/docs/options#option-ui
    ui: false,
    // shows any notifications in the browser if true
    notify: false,
    // directory witch will be displayed in browser
    server: {
      baseDir: TEST,
    },
  });
};

// change "test" files according to src when any changes occur
const watch = () => {
  gulp.watch(`${SRC}/*.html`, html);
  gulp.watch(`${SRC}/styles/**/*.css`, styles);
  gulp.watch(`${SRC}/scripts/**/*.js`, scripts);
  gulp.watch(`${SRC}/fonts/**/*`, fontsMain(TEST));
  gulp.watch(`${SRC}/images/**/*`, imagesMain(TEST));
};

// executes when you run "gulp build" in console
export const build = () => {
  return new Promise(function (res, rej) {
    buildMain();
    res();
  });
};

// build function
function buildMain() {

  // minify js, css, html
  htmlMinify();
  cssMinify();
  jsMinify();
  // transfer images and fonts into folder in variable DIST
  imagesMain(DIST)();
  fontsMain(DIST)();
}

// minifying functions
function htmlMinify() {
  gulp
  .src(`${TEST}/*.html`)
  .pipe(
    htmlmin({
      removeComments: true,
      collapseWhitespace: true,
    })
  )
  .pipe(gulp.dest(DIST));
}

function cssMinify() {
  gulp
  .src(`${TEST}/styles/index.css`)
  .pipe(postcss([csso]))
  .pipe(gulp.dest(`${DIST}/styles`));
}

function jsMinify() {
  gulp
  .src(`${TEST}/scripts/main.js`)
  .pipe(webpack(setModeWebpack('production')))
  .pipe(gulp.dest(`${DIST}/js`));
}



export default gulp.series(
  gulp.parallel(scripts, styles, html, imagesMain(TEST), fontsMain(TEST)),
  gulp.parallel(watch, server)
);
