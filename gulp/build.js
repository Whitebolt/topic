'use strict';

const run = require('run-sequence');

function fn(gulp, done) {
	run('node:build', 'browser:build', done);
}

module.exports = {deps: ['node:build', 'browser:build'], fn};
