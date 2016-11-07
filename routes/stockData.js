var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

var updateTime = new Date();
updateTime.setSeconds(updateTime.getSeconds() + 20);


/* GET stock data page. */
router.get('/StockData/price', function(req, res) {
	console.log("[GET] 'StockData/price'");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/' + date + '_' + stock + '.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			console.log('\tSend DataFound');
			res.send({
				msg: 'DataFound',
				content: parseCSV(data)
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
router.get('/StockData/forecast', function(req, res) {
	console.log("[GET] 'StockData/forecast'");
	console.log(req.query);
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var lastTimeUpdate = req.query.lastTimeUpdate;
	var file_path = 'database/' + date + '_' + stock + '.forecast.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		if(!lastTimeUpdate
			|| (Number(lastTimeUpdate) < updateTime.getTime()
			&& (new Date()).getTime() > updateTime.getTime())){
			console.log('\tSend DataFound');
			res.send({
				msg: 'DataFound',
				content: parseCSV(data)
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



module.exports = router;

