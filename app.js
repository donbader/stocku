// Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
const fs = require('fs');
const child_proc = require('child_process');


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


/*==================================
Read stock date
===================================*/
function readStockDate()
{
	var data = fs.readFileSync(__dirname + '/stockDate');
	var stockDate = data.toString().split('\n');
	
	return  stockDate[stockDate.length - 2];
}


/*==================================
Get date string
===================================*/
function getDate(date)
{
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	var d = date.getDate();

	return (d > 9) ? y.toString() + m.toString() + d.toString() : y.toString() + m.toString() + "0" + d.toString();
}


/*==================================
Start to update
===================================*/
function startUpdate()
{
	console.log('[INFO] Start to update...');

	var proc = child_proc.exec('./update', function(error, stdout, stderr){
		if(error) console.log(error.stack);
		console.log(stdout);
		console.log(stderr);
	});

	proc.on('exit', function(code){
		stat = 0;

		if(code == 0)
			console.log("[INFO] Finish to update");
		else
			console.log("[ERROR] Failed to update");
	});
}


/*==================================
Start to create file
===================================*/
function startCreate()
{
	console.log('[INFO] Start to create...');

	var proc = child_proc.exec('./create', function(error, stdout, stderr){
		if(error) console.log(error.stack);
		console.log(stdout);
		console.log(stderr);
	});

	proc.on('exit', function(code){
		stat = 0;

		if(code == 0)
			console.log("[INFO] Finish to create");
		else
			console.log("[ERROR] Failed to create");
	});
}


/*==================================
Refresh
===================================*/
function refresh()
{
	//Get current date
	var date_cur = new Date();
	curDate = getDate(date_cur);
	stockDate = readStockDate();
	if(curDate != stockDate) return;

	var h = date_cur.getHours();
	var min = date_cur.getMinutes();

	if(h == 8 && !isCreated){
		startCreate();
		isCreated = true;
	}

	if(h == 14 && isCreated)
		isCreated = false;

	if(h < 9 || (h == 13 && min >= 30) || h > 13) return;

	if(date_cur.getTime() - date.getTime() > 300000){
		console.log('---------------------------------------------------------');
		console.log(date_cur.toString());
		console.log('---------------------------------------------------------');
		console.log('Update date');

		date = date_cur;
		stockData.setUpdateTime(date);
	}
}


//Get current date
var date = new Date();
var curDate = getDate(date);
var stockDate = readStockDate();
var stat = 0;
var isCreated = false;

console.log('Server start at ' + date.toString());


//Refresh per 30 sec
refresh();
setInterval(refresh, 30000);
