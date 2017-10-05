'use strict';

const gulp = require('gulp');
const tasks = {
	'browser:build': require('./gulp/browser/build'),
	'browser:test': require('./gulp/browser/test'),
	'node:jsdoc-json': require('./gulp/node/jsdoc-json'),
	'node:build': require('./gulp/node/build'),
	'node:test': require('./gulp/node/test'),
	'build': require('./gulp/build'),
	'test': require('./gulp/test')
};

function createTask(taskId) {
	return function (done) {
		var stream = tasks[taskId].fn(gulp, done);
		if (stream) {
			if (stream.on) stream.on('end', done);
			if (stream.then) stream.then(done);
		}
	};
}

for (var taskId in tasks) gulp.task(taskId, tasks[taskId].deps, createTask(taskId));
