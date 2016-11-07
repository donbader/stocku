var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();


/* GET stock data page. */
router.get('/StockData/price', function(req, res) {
	console.log("[GET] 'StockData/price'");
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var file_path = 'database/' + date + '_' + stock + '.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		res.send(parseCSV(data));
	}catch(err){
		res.send([]);
	}
});
router.get('/StockData/forecast', function(req, res) {
	console.log("[GET] 'StockData/forecast'");
	var date = req.query.date.split('-').join('');
	var stock = req.query.stock;
	var file_path = 'database/' + date + '_' + stock + '.forecast.csv';
	try{
		var data = fs.readFileSync(file_path, 'utf-8');
		res.send(parseCSV(data));
	}catch(err){
		res.send([]);
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

