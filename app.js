// Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

// Routes
var index = require('./routes/index');


// App
var app = express();

// favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Add path
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../database')));

// for render '/'
app.use('/', index);




module.exports = app;
