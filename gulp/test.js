'use strict';

const run = require('run-sequence');

function fn(gulp, done) {
	run('node:test', 'browser:test', done);
}

module.exports = {deps: ['node:test', 'browser:test'], fn};
