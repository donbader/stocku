// Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

// Routes
var index = require('./routes/index');
var stockData = require('./routes/stockData');


// App
var app = express();

// favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Add path
app.use(express.static(path.join(__dirname, 'public')));


// Route Service
app.use('/', index);
app.use('/StockData', stockData);




module.exports = app;
