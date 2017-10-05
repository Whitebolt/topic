'use strict';

// No ES6 here to avoid any building.
var settings = require('./package.json').gulp;
settings.name = require('./package.json').name;

module.exports = require(settings.dest + '/' + settings.name + '.node.js');
