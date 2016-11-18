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


//Get current date
var date = new Date();
var y = date.getFullYear();
var m = date.getMonth() + 1;
var d = date.getDate();
var lastMin = date.getMinutes();
var lastHour = date.getHours();
var curDate = (d > 9) ? y.toString() + m.toString() + d.toString() : y.toString() + m.toString() + "0" + d.toString();

console.log("Current date: " + curDate);


//Read stock symbols
var data = fs.readFileSync(__dirname + '/stockSymbols');
var stockSymbol = data.toString().split('\n');
var isExit = 0;
var stat = 0;


/*=======================================
Copy stock data to hdfs
========================================*/
function startPut()
{
	stat = 1;
	var symbolList = '';
	console.log("[Put] Start to put data to hdfs...");

	for(var i = 0; i < stockSymbol.length - 1; ++i)
		symbolList += './database/price/' + curDate + '_' + stockSymbol[i] + '.csv ';

	var proc = child_proc.exec('hadoop fs -D dfs.block.size=1048576 -put -f ' + symbolList + '/input', 
							  	function(error, stdout, stderr){
		if(error){
			console.log(error.stack);
			console.log('Error code: ' + error.code);
			console.log('Signal received: ' + error.signal);
		}
	});

	proc.on('exit', function(code){
		if(code != 0)
			console.log('[Put] ERROR: Exited with ' + code);

		startUpdate();
	});
}


/*================================
Execute update.sh
=================================*/
function startUpdate()
{
	stat = 2;
	console.log("[Update] Start to update...");

	var proc = child_proc.exec('sh ./update.sh', function(error, stdout, stderr){
		if(error){
			console.log(error.stack);
			console.log("Error code: " + error.code);
			console.log("Signal received: " + error.signal);
		}

		console.log("[Update]\n" + stdout);
	});

	proc.on('exit', function(code){
		console.log("[Update] Exited with " + code);
		startSave();
	});
}


/*=================================
Execute save.sh
==================================*/
function startSave()
{
	stat = 3;
	isExit = 0;

	for(var i = 0; i < stockSymbol.length - 1; ++i){
		console.log("[Save] Start to save " + stockSymbol[i] + "...");

		var proc = child_proc.spawn('hadoop', 
					['fs', '-cat', '/output/' + curDate + '_' + stockSymbol[i] + '.fc.csv/part-*']);
		
		proc["id"] = i;
		proc.stdout["buf"] = '';

		proc.stdout.on('data', function(data){
			this.buf += data;
		});

		proc.stderr.on('data', function(data){
			console.log('[Save]');
			console.log(data.toString());
		});

		proc.on('close', function(code){
			if(code != 0)
				console.log('[Save] ERROR: Exited with ' + code);
			
			fs.appendFile("./database/forecast/" + curDate + "_" + stockSymbol[this.id] + ".fc.csv", 
						this.stdout.buf, 
						function(err){
				if(err) return console.error(err);
			});

			console.log('[Save] ' + stockSymbol[this.id] + ' saved');
			isExit++;
			if(isExit == stockSymbol.length - 1)
				stat = 0;
		});
	}
}


/*==================================
Refresh
===================================*/
function refresh()
{
	//Get current date
	date = new Date();
	var h = date.getHours();
	var min = date.getMinutes();
	var elapsed = 60 * (h - lastHour) + min - lastMin;

	if(elapsed < 5 || h < 9 || h > 13 || (h == 9 && min < 30) || (h == 13 && min > 30))
		return;

	console.log('---------------------------------------------------------');
	console.log(date.toString());
	console.log('---------------------------------------------------------');
	stockData.setUpdateTime(date);

	lastHour = h;
	lastMin = min;
	y = date.getFullYear();
	m = date.getMonth() + 1;
	d = date.getDate();
	curDate = (d > 9) ? y.toString() + m.toString() + d.toString() : y.toString() + m.toString() + "0" + d.toString();

	if(stat == 0) startPut();
	else console.log("refreshing...");
}


//Refresh per 30 sec
refresh();
setInterval(refresh, 30000);
