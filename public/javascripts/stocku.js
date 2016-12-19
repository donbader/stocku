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
			Date.prototype.plus = function(value, scale) {
				switch (scale) {
					case "sec":
						this.setSeconds(this.getSeconds() + value);
						break;
					case "min":
						this.setMinutes(this.getMinutes() + value);
						break;
					case "hr":
						this.setHours(this.getHours() + value);
						break;
					case "day":
						this.setDate(this.getDate() + value);
						break;
					case "month":
						this.setMonth(this.getMonth() + value);
						break;
					case "year":
						this.setYear(this.getYear() + value);
						break;
				}
				return this;
			}

		},
		/**************************************************
		 *              TOOLS                             *
		 **************************************************/
		randomDatum: function(ref, bias) {
			ref = ref || 100;
			bias = bias || 10;
			if (typeof ref === 'string')
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
			nextTime.plus(interval, scale);
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
			if (dependency)
			;
			else
				json[start][elementName] = STOCKU.randomDatum(100, 20);

			end = new Date(end);

			var currTime = start;
			do {
				var newData;

				if (dependency) {
					newData = STOCKU.genNextJsonData(currTime, dependency[currTime][d_elementName], interval, scale, bias);
				} else
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
		calcAccuracy: function(prevData, currData) {
			if (prevData === undefined || currData === undefined || currData.price === undefined || currData.forecast === undefined || prevData.price === undefined)
				return;
			var hit_acc = prevData["hit_acc"] || 0;
			var hit_acc_size = prevData["hit_acc_size"] || 0;

			var bias_forecast = parseFloat(currData["forecast"]) - parseFloat(prevData["price"]);
			var bias_price = parseFloat(currData["price"]) - parseFloat(prevData["price"]);

			if (typeof bias_forecast !== 'number' || typeof bias_price !== 'number') {
				return {};
			}
			// This is an extra condition
			// ( if price is not changed, then return prevData's accuracy)
			if(bias_price == 0){
				return {
					hit_acc: hit_acc,
					hit_acc_size: hit_acc_size,
					accuracy: parseFloat(((hit_acc / hit_acc_size).toFixed(2)))
				}
			}
			else if (bias_forecast != 0 && bias_price != 0) {
				bias_forecast * bias_price > 0 ? ++hit_acc : 0;
			} else if (bias_forecast == bias_price) {
				++hit_acc;
			}
			++hit_acc_size;

			return {
				hit_acc: hit_acc,
				hit_acc_size: hit_acc_size,
				accuracy: parseFloat(((hit_acc / hit_acc_size).toFixed(2)))
			}

		},
		addAccuracy: function(arr) {
			var accuracySoFar;
			for (var i = 1; i < arr.length; ++i) {
				if (arr[i].accuracy === undefined){
					var object = STOCKU.calcAccuracy(arr[i - 1], arr[i]);
					if(object){
						STOCKU.ObjectCombine(arr[i], object);
						accuracySoFar = object.accuracy;
					}
				}
			}
			return accuracySoFar;
		},
		addRMSE: function(data) {
			var size = 0;
			var square = 0;
			data[0].rmse_acc_size = size;
			data[0].rmse_acc_square = square;
			for (var i = 1; i < data.length; ++i) {
				if (data[i].price === undefined || data[i].forecast === undefined) {
					data[i].rmse_acc_size = size;
					data[i].rmse_acc_square = square;
					continue;
				}
				data[i].rmse_acc_square = data[i - 1].rmse_acc_square;
				data[i].rmse_acc_size = data[i - 1].rmse_acc_size;
				// console.log(i);
				// console.log(data[i-1].rmse_acc_square);
				data[i].rmse_acc_square += Math.pow(data[i].price - data[i].forecast, 2);
				data[i].rmse_acc_size += 1;
				data[i].rmse = Math.sqrt(data[i].rmse_acc_square / data[i].rmse_acc_size).toFixed(2);

				square = data[i].rmse_acc_square;
				size = data[i].rmse_acc_size;
			}
		},
		ToOhlc: function(arrData, interval, scale) {
			interval = interval || 5;
			scale = scale || "min";
			var startTime = new Date(arrData[0].time);
			var nextTime = new Date(startTime).plus(interval, scale);
			var ohlc;
			var ohlcs = [];
			for (var i = 0; i < arrData.length; ++i) {
				if(!arrData[i].price)continue;
				var time = new Date(arrData[i].time).getTime();
				if(time == startTime.getTime()){
					ohlcs.push({time: startTime.yyyymmddHHMMSS()});
					ohlc = ohlcs[ohlcs.length - 1];
					ohlc.open = ohlc.high = ohlc.low = ohlc.close
						= arrData[i].price;
				}
				else if (time > startTime.getTime() && time <= nextTime.getTime()){
					if(arrData[i].price > ohlc.high)
						ohlc.high = arrData[i].price;
					else if(arrData[i].price < ohlc.low )
						ohlc.low = arrData[i].price;
					ohlc.close = arrData[i].price;
				}
				if (time == nextTime.getTime()){
					startTime.plus(interval, scale);
					nextTime.plus(interval, scale);
					--i; // redo again
				}

			}
			return ohlcs;
		},
		ObjectCombine: function(a, b) {
			for (var attr in b) {
				if (typeof b[attr] === 'object') {
					if (b[attr] instanceof Array) {
						a[attr] = a[attr] || [];
						for(var index in b[attr]){
							var exist = a[attr].findIndex((element)=>element === b[attr]);
							if(exist != -1){
								a[attr][exist] = b[attr][index];
							}
						}
						// if(var index = a[attr].findIndex((element)=>element === b[attr]) != -1){
						// }
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
		getLastElementAppear: function(arr, elementName) {
			if (arr === undefined) return;
			for (var i = arr.length; i >= 0; --i) {
				if (arr[i] !== undefined && arr[i][elementName] !== undefined) {
					return {element: arr[i],index:i};
				}
			}
		},
		FetchNews: function(){
			console.log("Fetching News...");
			$.ajax({
				type:"GET",
				url: "/StockData/News",
				success: function(html){
					var newsdiv = $("#newsdiv");
					var table = $(html);
					newsdiv.append(table);
					newsdiv.prepend("重大要聞");
					table.find('.geminiAd').remove();
					table.find('.stext').remove();
					console.log(table.html());
				}
			})
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
			if (!(valueField === undefined)) {
				for (var attr in config) {
					for (var inner in config[attr][0]) {
						switch (inner) {
							case "id":
								config[attr][0][inner] += valueField;
								break;
							case "title":
							case "valueField":
							case "divId":
								if(config[attr][0][inner] == "")
									config[attr][0][inner] = valueField;
								break;
							default:
								break;
						}
					}
				}
			}
			return config;
		},
		BindGraphAndAxis: function(graph, axis) {
			if (axis.valueAxes[0].id) {
				graph.graphs[0].valueAxis = axis.valueAxes[0].id;
			} else {
				console.error("Bind Failed! (axis has no id)");
				console.error(axis.valueAxes[0]);
			}

		},
		Set: function(object, key, value){
			if(object.graphs){
				object.graphs[0][key] = value;
			}
			else if(object.valueAxes)
				object.valueAxes[0][key] = value;
			else {
				for(var prop in object){
					object[prop][key] = value;
					break;
				}
			}
		},
		TrendLine: function(arr){
			var x = [],y = [];
			// TODO: Regression line implement
			for(var i = 0;i<arr.length - 1;i++){
				arr[i]['reg'] = null;
				x[i] = i;
				y[i] = arr[i]['price'];
			}
			var formular = LeastSquares(x,y);
			//console.log(formular);
			arr[0]['reg'] = formular['bias'].toFixed(2);
			arr[arr.length - 1]['reg'] = (arr.length - 1) * formular['slope'] + formular['bias'];
			arr[arr.length - 1]['reg'] = arr[arr.length - 1]['reg'].toFixed(2);
			return formular['slope'];
		},
		/**************************************************
		 *              CHART                             *
		 **************************************************/
		Chart: function(id, type) {
			// generate random id
			var randNum = new Date().getTime() % 1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="' + chartID + '"></div>');
			$('#' + chartID).attr('style', "width: 100%; height:400px;padding: 10px 10px;");

			//---------------------------------------------------------------
			// Chart Template
			var config = STOCKU.LoadSettings("config/chart.template.json");
			var chart = this.instance = new AmCharts.makeChart(chartID, config);

			//---------------------------------------------------------------
			// Component
			// Load file
			// rmse_axis.valueAxes[0].labelFunction = function(data){return (data * 100).toFixed(2) + "%";};


			// Json data
			this.jsonData = {};
			this.addJsonData = function(data) {
				// record old dates
				this.prevStartTime = chart.startDate;
				this.prevEndTime = chart.endDate;
				STOCKU.mergeJson(this.jsonData, data);
				var arr = chart.dataProvider;
				chart.dataProvider = STOCKU.JsonToArray(this.jsonData);
				chart.dataProvider.sort((a, b) => new Date(a.time) < new Date(b.time) ? -1 : 1);
				chart.dataProvider[chart.dataProvider.length - 1].bullet = "round";

			};
			this.arrayData = function(arr) {
				// record old dates
				this.prevStartTime = chart.startDate;
				this.prevEndTime = chart.endDate;

				if (arr === undefined)
					return chart.dataProvider;
				else {
					chart.dataProvider = arr;
					return chart.dataProvider;
				}
			};
			this.zoomToDates = function(start, end) {
				return chart.zoomToDates(start, end);
			}
			this.validateData = () => chart.validateData();

			this.add = function (component, axis){
				switch(arguments.length){
					case 1:
						STOCKU.ObjectCombine(chart, component);
						break;
					case 2:
						STOCKU.BindGraphAndAxis(component, axis);
						STOCKU.ObjectCombine(chart, component);
						if(chart.valueAxes.findIndex((e)=>e.id == axis.valueAxes[0].id) == -1)
							STOCKU.ObjectCombine(chart, axis);
						break;
					default:break;
				}
			}
			// main
			switch(type){
				case "line":
					var price_line = STOCKU.LoadSettings("config/graph.line.json", "price");
					var forecast_line = STOCKU.LoadSettings("config/graph.line.json", "forecast");
					var rmse_line = STOCKU.LoadSettings("config/graph.line.json", "rmse");
					var reg_line = STOCKU.LoadSettings("config/graph.line.json", "reg");
					var price_axis = STOCKU.LoadSettings("config/valueAxis.json", "price");
					var rmse_axis = STOCKU.LoadSettings("config/valueAxis.json", "rmse");
					var legend = STOCKU.LoadSettings("config/legend.json", "legenddiv");
					// Modify Config
					price_line.graphs[0].lineAlpha = 1;
					price_line.graphs[0].balloon = {
						"borderThickness": 0.2,
						"cornerRadius": 10,
						"adjustBorderColor": false,
						"color": "#ffffff",
						"shadowAlpha": 0
					};

					forecast_line.graphs[0].lineAlpha = 0.3;
					forecast_line.graphs[0].bulletField = "bullet";
					rmse_line.graphs[0].hidden = true;
					reg_line.graphs[0].hidden = true;
					price_axis.valueAxes[0].title = "price";
					rmse_axis.valueAxes[0].title = "rmse";
					rmse_axis.valueAxes[0].position = "right";
					rmse_axis.valueAxes[0].color = "#00bb33";
					rmse_axis.valueAxes[0].axisColor = "#00bb33";
					chart.chartScrollbar.graph = price_line.graphs[0].id;


					this.add(price_line, price_axis);
					this.add(forecast_line, price_axis);
					this.add(rmse_line, rmse_axis);
					this.add(reg_line);
					this.add(legend);
					break;
				case "candlestick":
					var candlestick = STOCKU.LoadSettings("config/graph.candlestick.json");
					var axis = STOCKU.LoadSettings("config/valueAxis.json", "candlestick");
					axis.valueAxes[0].title = "price";
					chart.chartScrollbar.graph = candlestick.graphs[0].id;
					this.add(candlestick, axis);
					break;

			}

		},
		Searcher: function(divId) {
			var scope = this;
			this.$ = {};
			this.state = {price: {}, forecast:{}};
			var input = this.$.input = $('<input class="stocku" type="search" placeholder="股票代碼">');
			var button = this.$.button = $('<input class="stocku" type="button">');
			$('#' + divId).append(input);
			$('#' + divId).append(button);
			button.attr('style', 'left: -25px;' + 'top: 5px;' + 'background: url("/images/search.png") no-repeat center;');

			// event
			input.on('keydown', (event) => {
				if (event.keyCode == 13) scope.search(event);
			});
			button.on('mouseup', (event) => scope.search(event));

			// Functions
			this.search = function() {
				// define search function
				console.log(input.val());
				console.log(new Date().toISOString().split("T")[0]);
			};
			this.val = function(value) {
				if (value === undefined)
					return input.val();
				else
					return val(value);
			}

		},
		SearcherWithDate: function(divId) {
			var scope = this;
			this.$ = {};
			this.state = {price: {}, forecast:{}};

			var searcher = this.searcher = new STOCKU.Searcher(divId);
			this.$.input = searcher.$.input;
			this.$.button = searcher.$.button;
			var date = this.$.date = $('<input class="stocku" type="date">');
			date.val(new Date().toISOString().split("T")[0]);
			$('#' + divId).append(date);

			date.on('keydown', (event) => {
				if (event.keyCode == 13) searcher.search();
			});

			// function override
			searcher.search = function() {
				console.log(searcher.val());
				console.log(date.val());
			}

		},
		Tracker: function(divId) {
			var scope = this;
			this.$ = {};
			var checkbox = this.$.checkbox = $('<input class="stocku" type="checkbox" checked>');
			var input = this.$.input = $('<input class="stocku" type="number" value="20">');
			$('#' + divId).append(checkbox);
			$('#' + divId).append('追蹤最近');
			$('#' + divId).append(input);
			$('#' + divId).append('min');

			input.on({
				focusout: (event) => scope.track(event),
				keydown: (event) => {
					if (event.keyCode == 13)
						scope.track(event);
				}
			});
			checkbox.on('change', function(event) {
				if (this.checked)
					scope.track(event);
			});

			// generally zoom Function
			this.track = function(event) {
				console.log(checkbox.prop("checked"));
				console.log(input.val());
			}
		}


	};

	return STOCKU;
}));

/**************************************************
 *              Least Square                      *
 **************************************************/
function LeastSquares(values_x, values_y) {
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_xx = 0;
    var count = 0;

    /*
     * We'll use those variables for faster read/write access.
     */
    var x = 0;
    var y = 0;
    var values_length = values_x.length;

    if (values_length != values_y.length) {
        throw new Error('The parameters values_x and values_y need to have same size!');
    }

    /*
     * Nothing to do.
     */
    if (values_length === 0) {
        return [ [], [] ];
    }

    /*
     * Calculate the sum for each of the parts necessary.
     */
    for (var v = 0; v < values_length; v++) {
        x = values_x[v];
        y = values_y[v];
        sum_x += x;
        sum_y += y;
        sum_xx += x*x;
        sum_xy += x*y;
        count++;
    }

    /*
     * Calculate m and b for the formular:
     * y = x * m + b
     */
    var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
    var b = (sum_y/count) - (m*sum_x)/count;

    return { slope : m , bias : b };
}
