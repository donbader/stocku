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

	var mon = (m > 9) ? m.toString() : "0" + m.toString();
	var day = (d > 9) ? d.toString() : "0" + d.toString();

	return y.toString() + mon + day;
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
function startComputeAcc()
{
	console.log('[INFO] Start to compute accuracy...');

	var proc = child_proc.exec('./acc ./database/price ./database/forecast ./database/accuracy', function(error, stdout, stderr){
		if(error) console.log(error.stack);
		console.log(stdout);
		console.log(stderr);
	});

	proc.on('exit', function(code){
		stat = 0;

		if(code == 0)
			console.log("[INFO] Finish to compute accuracy");
		else
			console.log("[ERROR] Failed to compute accuracy");
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

	if(h > 13 && !isAcc){
		console.log("-----------------------------------------------");
		console.log(date_cur.toString());
		console.log("-----------------------------------------------");
		startComputeAcc();
		isAcc = true;
	}

	if(h > 0 && h < 13) isAcc = false;
}


//Get current date
var date = new Date();
var curDate = getDate(date);
var stockDate = readStockDate();
var stat = 0;
var isAcc = true;

console.log('Server start at ' + date.toString());

//Refresh per 30 sec
refresh();
setInterval(refresh, 30000);
