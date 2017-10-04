'use strict';

const gulp = require('gulp');
const tasks = {
	'browser:build': require('./gulp/browser/build'),
	'node:build': require('./gulp/node/build'),
	'node:test': require('./gulp/node/test')
};

function createTask(taskId) {
	return function () {
		tasks[taskId].fn(gulp);
	};
}

for (var taskId in tasks) gulp.task(taskId, tasks[taskId].deps, createTask(taskId));
