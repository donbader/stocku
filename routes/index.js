var express = require('express');
var path = require('path');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next){
	res.sendFile(path.join(__dirname, '../', 'index.html'));
});

router.get('/Home', function(req, res, next){
	res.sendFile(path.join(__dirname, '../', 'index.html'));
});

router.get('/history', function(req, res, next){
	res.sendFile(path.join(__dirname, '../', 'history.html'));
});

router.get('/stockid', function(req, res, next){
	res.sendFile(path.join(__dirname, '../', 'stockid.html'));
});


module.exports = router;
