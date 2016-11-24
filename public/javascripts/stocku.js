/**************************************************
 *              NOTE                              *
 **************************************************/
// change sync to async

(function(global, factory) {
	if (global.STOCKU === undefined) {
		global.STOCKU = factory();
		global.STOCKU.init();
	}
}(window, function() {
	'use strict';
	var STOCKU = {
		init: function() {
			// Date prototype
			Date.prototype.yyyymmdd = function() {
				var mm = this.getMonth() + 1; // getMonth() is zero-based
				var dd = this.getDate();
				var yyyy = this.getFullYear();
				return yyyy + "-" + (mm < 10 ? '0' + mm : mm) + "-" + (dd < 10 ? '0' + dd : dd)
			}
			Date.prototype.HHMMSS = function() {
				var HH = this.getHours();
				var MM = this.getMinutes();
				var SS = this.getSeconds();
				return (HH < 10 ? '0' + HH : HH) + ":" + (MM < 10 ? '0' + MM : MM) + ":" + (SS < 10 ? '0' + SS : SS)
			}
			Date.prototype.yyyymmddHHMMSS = function() {
					return this.yyyymmdd() + " " + this.HHMMSS();
			}
		},
/**************************************************
 *              TOOLS                             *
 **************************************************/
		randomDatum: function(ref, bias) {
			ref = ref || 100;
			bias = bias || 10;
			if(typeof ref === 'string')
				ref = parseFloat(ref);
			var rand = Math.random() * 2 * bias - bias;
			return parseFloat((ref + rand).toFixed(2));
		},
		genNextJsonData: function(prevTime, prevValue, interval, scale, bias) {
			var nextTime = new Date(prevTime);
			var nextData = {};
			interval = interval || 1;
			scale = scale || "min";
			bias = bias || 5;
			switch (scale) {
				case "sec":
					nextTime.setSeconds(nextTime.getSeconds() + interval);
					break;
				case "min":
					nextTime.setMinutes(nextTime.getMinutes() + interval);
					break;
				case "hr":
					nextTime.setHours(nextTime.getHours() + interval);
					break;
				case "day":
					nextTime.setDate(nextTime.getDate() + interval);
					break;
				case "month":
					nextTime.setMonth(nextTime.getMonth() + interval);
					break;
				case "year":
					nextTime.setYear(nextTime.getYear() + interval);
					break;
			}
			nextTime = nextTime.yyyymmddHHMMSS();
			var nextValue = STOCKU.randomDatum(prevValue, bias);
			nextData[nextTime] = parseFloat(nextValue.toFixed(2));
			return nextData;
		},
		genJsonData: function(start, end, elementName, interval, scale, bias, dependency, d_elementName) {
			interval = interval || 1;
			scale = scale || "min";
			bias = bias || 5;
			var json = {};
			json[start] = {};
			if(dependency)
				;
			else
				json[start][elementName] = STOCKU.randomDatum(100, 20);

			end = new Date(end);

			var currTime = start;
			do {
				var newData;

				if(dependency){
					newData = STOCKU.genNextJsonData(currTime, dependency[currTime][d_elementName], interval, scale, bias);
				}
				else
					newData = STOCKU.genNextJsonData(currTime, json[currTime][elementName], interval, scale, bias);

				for (var prop in newData) {
					json[prop] = json[prop] || {};
					json[prop][elementName] = newData[prop];
					currTime = prop;
				}

			} while (new Date(currTime) < end)
			return json;

		},
		mergeJson: function(a, b) {
			for (var prop in b) {
				a[prop] = a[prop] || {};
				for (var inner in b[prop]) {
					a[prop][inner] = b[prop][inner];
				}
			}
			return a;
		},
		JsonToArray: function(obj) {
			var arr = [];
			for (var prop in obj) {
				arr.push({
					time: prop
				});
				for (var inner in obj[prop]) {
					arr[arr.length - 1][inner] = obj[prop][inner];
				}
			}
			return arr;
		},
		calcAccuracy: function(prevData, currData){
			if(	prevData === undefined
				|| currData === undefined
				||currData.price === undefined
				|| currData.forecast === undefined
				|| prevData.price === undefined)
					return;
			var hit_acc = prevData["hit_acc"] || 0;
			var hit_acc_size = prevData["hit_acc_size"] || 0;

			var bias_forecast = parseFloat(currData["forecast"]) - parseFloat(prevData["price"]);
			var bias_price = parseFloat(currData["price"]) - parseFloat(prevData["price"]);

			if(typeof bias_forecast !== 'number' || typeof bias_price !== 'number'){
				return {};
			}
			if(bias_forecast != 0 && bias_price != 0){
				bias_forecast * bias_price > 0 ? ++hit_acc : 0;
			}
			else if(bias_forecast == bias_price){
				++hit_acc;
			}
			++hit_acc_size;

			return {
				hit_acc: hit_acc,
				hit_acc_size: hit_acc_size,
				accuracy: parseFloat(((hit_acc/hit_acc_size).toFixed(2)))
			}

		},
		addAccuracy: function(arr) {
			for(var i = 1; i< arr.length; ++i){
				if(arr[i].accuracy === undefined)
					STOCKU.ObjectCombine(arr[i], STOCKU.calcAccuracy(arr[i-1], arr[i]));
			}
		},
		calcRMS: function(data){
			var size = 0;
			var square = 0;
			data[0].acc_size = size;
			data[0].acc_square = square;
			for(var i = 1 ;i < data.length ; ++i){
				if(data[i].price === undefined
					|| data[i].forecast === undefined){
					data[i].acc_size = size;
					data[i].acc_square = square;
					continue;
				}
				data[i].acc_square = data[i-1].acc_square;
				data[i].acc_size = data[i-1].acc_size;
				// console.log(i);
				// console.log(data[i-1].acc_square);
				data[i].acc_square += Math.pow(data[i].price - data[i].forecast, 2);
				data[i].acc_size += 1;
				data[i].rmse = Math.sqrt(data[i].acc_square / data[i].acc_size);

				square = data[i].acc_square;
				size = data[i].acc_size;
			}
		},
		ObjectCombine: function(a, b) {
			for (var attr in b) {
				if (typeof b[attr] === 'object') {
					if (b[attr] instanceof Array) {
						a[attr] = a[attr] || [];
						a[attr] = a[attr].concat(b[attr]);
					} else { // object
						a[attr] = a[attr] || {};
						STOCKU.ObjectCombine(a[attr], b[attr]);
					}
				} else {
					a[attr] = b[attr];
				}
			}
			return a;
		},
		lastTimeAppear : function(arr, elementName){
			if(arr === undefined) return;
			for(var i = arr.length; i >= 0 ; --i){
				if(arr[i] !== undefined && arr[i][elementName] !== undefined){
					return new Date(arr[i].time).getTime();
				}
			}
		},
		LoadSettings: function(url, valueField) {
			var config;
			$.ajax({
				url: url,
				async: false,
				dataType: 'json',
				success: function(data) {
					config = data;
				}

			});
			if(!(valueField === undefined)){
				for(var attr in config){
					for(var inner in config[attr][0]){
						switch(inner){
							case "id": config[attr][0][inner] += valueField;break;
							case "title":case "valueField":case "divId":
								config[attr][0][inner] = valueField;break;
							default: break;
						}
					}
				}
			}
			return config;
		},
		BindGraphAndAxis: function (graph, axis){
			if(axis.valueAxes[0].id){
				graph.graphs[0].valueAxis = axis.valueAxes[0].id;
			}
			else{
				console.error("Bind Failed! (axis has no id)");
				console.error(axis.valueAxes[0]);
			}

		},
/**************************************************
 *              CHART                             *
 **************************************************/
		ChartInMinuteScale: function(id) {
			// generate random id
			var randNum = new Date().getTime() % 1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="' + chartID + '"></div>');
			$('#' + chartID).attr('style', "width: 100%; height:400px;");

			//---------------------------------------------------------------
			// Chart Template
			var config = STOCKU.LoadSettings("config/chart.template.json");
			var chart = this.instance = new AmCharts.makeChart(chartID, config);

			//---------------------------------------------------------------
			// Component
			// Load file
			var smoothedLine_price = STOCKU.LoadSettings("config/graph.smoothedline.json", "price");
			var smoothedLine_forecast = STOCKU.LoadSettings("config/graph.smoothedline.json", "forecast");
			var smoothedLine_rmse = STOCKU.LoadSettings("config/graph.line.json", "rmse");
			var price_axis = STOCKU.LoadSettings("config/valueAxis.json", "v1");
			var rmse_axis = STOCKU.LoadSettings("config/valueAxis.json", "v2");
			var legend = STOCKU.LoadSettings("config/legend.json", "legenddiv");

			// Modify Config
			smoothedLine_forecast.graphs[0].balloon.enabled = false;
			rmse_axis.valueAxes[0].position = "left";
			legend.valueFunction = function(){return "HIHI";}
			// rmse_axis.valueAxes[0].labelFunction = function(data){return (data * 100).toFixed(2) + "%";};

			// Axis Bind To Graph
			STOCKU.BindGraphAndAxis(smoothedLine_price, price_axis);
			STOCKU.BindGraphAndAxis(smoothedLine_forecast, price_axis);
			STOCKU.BindGraphAndAxis(smoothedLine_rmse, rmse_axis);

			// Bind to Chart
			STOCKU.ObjectCombine(chart, smoothedLine_price);
			STOCKU.ObjectCombine(chart, smoothedLine_forecast);
			STOCKU.ObjectCombine(chart, smoothedLine_rmse);
			STOCKU.ObjectCombine(chart, price_axis);
			STOCKU.ObjectCombine(chart, rmse_axis);
			STOCKU.ObjectCombine(chart, legend);
			//---------------------------------------------------------------


			// Json data
			this.jsonData = {};
			this.addJsonData = function(data) {
				// record old dates
				this.prevStartTime = chart.startDate;
				this.prevEndTime = chart.endDate;

				STOCKU.mergeJson(this.jsonData, data);
				chart.dataProvider = STOCKU.JsonToArray(this.jsonData);
				chart.dataProvider.sort((a,b)=>new Date(a.time) < new Date(b.time) ? -1 : 1);
			};
			this.arrayData =  function (arr){
				if(arr === undefined)
					return chart.dataProvider;
				else{
					// record old dates
					this.prevStartTime = chart.startDate;
					this.prevEndTime = chart.endDate;

					chart.dataProvider = arr;
					chart.validateData();
					return chart.dataProvider;
				}
			};
			this.zoomToDates = function (start, end){
				return chart.zoomToDates(start, end);
			}
			this.validateData = ()=>chart.validateData();

		},
		ChartWithCandleSticks: function(id){
			// generate random id
			var randNum = new Date().getTime() % 1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="' + chartID + '"></div>');
			$('#' + chartID).attr('style', "width: 100%; height:400px;");

			//---------------------------------------------------------------
			// Chart Template
			var config = STOCKU.LoadSettings("config/chart.template.json");
			var chart = this.instance = new AmCharts.makeChart(chartID, config);

			var smoothedLine_price = STOCKU.LoadSettings("config/graph.smoothedline.json", "price");
			var smoothedLine_forecast = STOCKU.LoadSettings("config/graph.smoothedline.json", "forecast");
			var smoothedLine_accuracy = STOCKU.LoadSettings("config/graph.line.json", "accuracy");
			var price_axis = STOCKU.LoadSettings("config/valueAxis.json", "v1");
			var accuracy_axis = STOCKU.LoadSettings("config/valueAxis.json", "v2");
			var legend = STOCKU.LoadSettings("config/legend.json", "legenddiv");

			// Modify Config
			smoothedLine_forecast.graphs[0].balloon.enabled = false;
			accuracy_axis.valueAxes[0].position = "left";
			accuracy_axis.valueAxes[0].labelFunction = function(data){return (data * 100).toFixed(2) + "%";};

			// Axis Bind To Graph
			STOCKU.BindGraphAndAxis(smoothedLine_price, price_axis);
			STOCKU.BindGraphAndAxis(smoothedLine_forecast, price_axis);
			STOCKU.BindGraphAndAxis(smoothedLine_accuracy, accuracy_axis);

			// Bind to Chart
			STOCKU.ObjectCombine(chart, smoothedLine_price);
			STOCKU.ObjectCombine(chart, smoothedLine_forecast);
			STOCKU.ObjectCombine(chart, smoothedLine_accuracy);
			STOCKU.ObjectCombine(chart, price_axis);
			STOCKU.ObjectCombine(chart, accuracy_axis);
			STOCKU.ObjectCombine(chart, legend);

			//---------------------------------------------------------------
			// Json data
			this.jsonData = {};
			this.addJsonData = function(data) {
				// record old dates
				this.prevStartTime = chart.startDate;
				this.prevEndTime = chart.endDate;

				STOCKU.mergeJson(this.jsonData, data);
				chart.dataProvider = STOCKU.JsonToArray(this.jsonData);
				chart.dataProvider.sort((a,b)=>new Date(a.time) < new Date(b.time) ? -1 : 1);
			};
			this.arrayData =  function (arr){
				if(arr === undefined)
					return chart.dataProvider;
				else{
					// record old dates
					this.prevStartTime = chart.startDate;
					this.prevEndTime = chart.endDate;

					chart.dataProvider = arr;
					chart.validateData();
					return chart.dataProvider;
				}
			};
			this.zoomToDates = function (start, end){
				return chart.zoomToDates(start, end);
			}
			this.validateData = ()=>{
				chart.validateData()
			};

		},
		Searcher: function(divId){
			var scope = this;
			this.$ = {};
			var input = this.$.input = $('<input type="search" placeholder="股票代碼">');
			var button = this.$.button = $('<input type="button">');
			$('#'+divId).append(input);
			$('#'+divId).append(button);
			button.attr('style', 'left: -25px;'
								+'top: 5px;'
								+'background: url("/images/search.png") no-repeat center;');

			// event
			input.on('keydown',(event)=>{ if(event.keyCode == 13)scope.search(event); });
			button.on('mouseup',(event)=>scope.search(event));

			// Functions
			this.search = function(){
				// define search function
				console.log(input.val());
				console.log(new Date().toISOString().split("T")[0]);
			};
			this.val = function(value){
				if(value === undefined)
					return input.val();
				else
					return val(value);
			}

		},
		SearcherWithDate: function(divId){
			var scope = this;
			this.$ = {};
			var searcher = this.searcher = new STOCKU.Searcher(divId);
			this.$.input = searcher.$.input;
			this.$.button = searcher.$.button;
			var date = this.$.date = $('<input type="date">');
			date.val(new Date().toISOString().split("T")[0]);
			$('#'+divId).append(date);

			date.on('keydown',(event)=>{ if(event.keyCode == 13)searcher.search(); });

			// function override
			searcher.search = function(){
				console.log(searcher.val());
				console.log(date.val());
			}

		},
		Tracker: function(divId){
			var scope = this;
			this.$ = {};
			var checkbox = this.$.checkbox = $('<input type="checkbox" checked>');
			var input = this.$.input = $('<input type="number" value="20">');
			$('#'+divId).append(checkbox);
			$('#'+divId).append('追蹤最近');
			$('#'+divId).append(input);
			$('#'+divId).append('min');

			input.on({
				focusout: (event)=>scope.track(event),
				keydown: (event)=>{
					if(event.keyCode == 13)
						scope.track(event);
				}
			});
			checkbox.on('change', function(event){
				if(this.checked)
					scope.track(event);
			});

			// generally zoom Function
			this.track = function (event){
				console.log(checkbox.prop("checked"));
				console.log(input.val());
			}
		}


	};

	return STOCKU;
}));