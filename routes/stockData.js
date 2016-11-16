var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var updateTime = new Date();
updateTime.setSeconds(updateTime.getSeconds() + 20);


/* GET stock data page. */
router.get('/price', function(req, res) {
	console.log("[GET] 'StockData/price'");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/price/' + date + '_' + stock + '.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			console.log('\tSend DataFound');
			res.send({
				msg: 'DataFound',
				content: parseCSVToJSON(data)
			});
		}
		else {
			console.log('\tSend AlreadyUpdate');
			res.send({
				msg: 'AlreadyUpdate'
			});
		}
	}catch(err){
		res.send({
			msg: 'DataNotFound'
		});
	}
});
router.get('/forecast', function(req, res) {
	console.log("[GET] 'StockData/forecast'");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/forecast/' + date + '_' + stock + '.forecast.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			console.log('\tSend DataFound');
			res.send({
				msg: 'DataFound',
				content: parseCSVToJSON(data)
			});
		}
		else {
			console.log('\tSend AlreadyUpdate');
			res.send({
				msg: 'AlreadyUpdate'
			});
		}
	}catch(err){
		res.send({
			msg: 'DataNotFound'
		});
	}
});

router.get('/price/range', function(req, res){
	var date = req.query.date;
	var stock = req.query.stock;
	var startTime = req.query.startTime;
	var endTime = req.query.endTime;

	var file_path =  'database/' + date + '_' + stock + '.csv';
	console.log(req.query);
	fs.readFile(file_path, 'utf-8', (err, csv)=>{
		if(err){
			res.send(err);
			return;
		}
		var data = parseCSV(csv);
		data = filter(data, startTime, endTime);
		res.send(data);
	});

});

router.get('/forecast/range', function(req, res){
	var date = req.query.date;
	var stock = req.query.stock;
	var startTime = req.query.startTime;
	var endTime = req.query.endTime;

	var file_path =  'database/' + date + '_' + stock + '.forecast.csv';
	console.log(req.query);
	fs.readFile(file_path, 'utf-8', (err, csv)=>{
		if(err){
			res.send(err);
			return;
		}
		var data = parseCSV(csv);
		data = filter(data, startTime, endTime);
		res.send(data);
	});
});

router.post('/accuracy', function(req, res){
	
})

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

module.exports = router;

