var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var updateTime = new Date();
// updateTime.setSeconds(updateTime.getSeconds() + 20);


/* GET stock data page. */
router.get('/price', function(req, res) {
	process.stdout.write("[GET] 'StockData/price'   \t");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/price/' + date + '_' + stock + '.csv';
	fs.readFile(file_path,'utf-8', (err, data)=>{
		if(err){
			console.error(err);
			res.send({
				msg: 'DataNotFound',
				stock: stock,
				date: date
			})
			return;
		}

		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			res.send({
				msg: 'DataFound',
				stock: stock,
				date: date,
				content: parseCSVToJSON(data)
			});
		}
		else{
			res.send({
				msg: 'AlreadyUpdate'
			});
		}

	});
});

router.get('/forecast', function(req, res) {
	process.stdout.write("[GET] 'StockData/forecast'\t");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/forecast/' + date + '_' + stock + '.fc.csv';
	fs.readFile(file_path,'utf-8', (err, data)=>{
		if(err){
			console.error(err);
			res.send({
				msg: 'DataNotFound'
			})
			return;
		}
		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			res.send({
				msg: 'DataFound',
				stock: stock,
				date: date,
				content: parseCSVToJSON(data)
			});
		}
		else{
			res.send({
				msg: 'AlreadyUpdate'
			});
		}
	});
});




function parseCSV(data, delimiter){
	data = data.split('\n');
	delimiter = delimiter || ',';
	var KeyNames = data[0].split(delimiter);
	var objects = [];
	for(var i = 1; i < data.length; ++i){
		var elements = data[i].split(delimiter);
		if(elements.length != KeyNames.length)continue;
		var obj = {};
		for(var k in KeyNames){
			obj[KeyNames[k]] = elements[k];
		}
		objects.push(obj);
	}
	return objects;
}
function parseCSVToJSON(data, delimiter){
	data = data.split('\n');
	delimiter = delimiter || ',';
	var KeyNames = data[0].split(delimiter);
	var objects = {};
	for(var i = 1; i < data.length; ++i){
		var elements = data[i].split(delimiter);
		if(elements.length != KeyNames.length)continue;
		objects[elements[0]] = objects[elements[0]] || {};
		for(var k = 1 ; k < KeyNames.length; ++k){
			objects[elements[0]][KeyNames[k]] = elements[k];
		}
	}
	return objects;
}

function filter(data, startTime, endTime){
	startTime = new Date(startTime).getTime();
	endTime = new Date(endTime).getTime();
	return data.filter((element)=>{
		var time = new Date(element.time).getTime();
		return time >= startTime && time <= endTime;
	});
}

router.setUpdateTime = function(date){
	updateTime = date;
}

module.exports = router;

