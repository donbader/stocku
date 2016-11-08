/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var chart;
//fill default date
$("#stock_date").val(new Date().toISOString().split("T")[0]);
//fill default stock id
$("#stock_id").val(2498);
//config chart style and init
d3.json("config/generalChart_no_legend.json", (style) => {
    chart = AmCharts.makeChart("chartdiv", style);
    chart.addListener('dataUpdated', zoomChart);
    /* init as server's data */
    $("#stock_id").focus().focusout();
});

/**************************************************
 *              GLOBAL FUNCTION                   *
 **************************************************/

//--------------------------------------------------
var oldStartDate, oldEndDate;
function zoomChart() {
    chart.zoomToDates(oldStartDate, oldEndDate);
}
//--------------------------------------------------
function recordDate() {
    oldStartDate = new Date(chart.startDate);
    oldEndDate = new Date(chart.endDate);
}
//--------------------------------------------------
function search(){
    var stock_id = $("#stock_id").val();
    var date = $("#stock_date").val().split('-').join('');
    log("#stock_id : " + stock_id,false);
    log("#stock_date : " + date,false);
    search_and_response(stock_id,date);
}
//--------------------------------------------------
//send query to server and response
function search_and_response(stock_id,date){
    var lastTimeUpdate;
    $.get("/StockData/price", {
            stock: stock_id,
            date: date,
            lastTimeUpdate: lastTimeUpdate,
        },
        (response) => {
            log(response.msg,false);
            log(response.content,false);
            if(response.msg == 'DataFound'){
                $("#stock_id").trigger("DataFound", ["YOU GOT IT!", response.content]);
                lastTimeUpdate = (new Date()).getTime();
            }
            else if(response.msg == 'AlreadyUpdate'){
               
            }
            else{//response.msg == 'DataNotFound'
                 $("#stock_id").trigger("DataNotFound", ["FAIL!", ]);
                lastTimeUpdate = (new Date()).getTime();
            }
        }
    );
}
//--------------------------------------------------

/**************************************************
 *              DEBUG FUNCTION                    *
 **************************************************/
//If you wanna disable debugging, make var enable_debug 
//false !!
var enable_debug = true;
//--------------------------------------------------
function log(msg,debug=true){
    if(debug && enable_debug)
        console.log(msg);
}
/**************************************************
 *              DEPLOY EVENT                      *
 **************************************************/
$("#stock_id").keyup(search);
//--------------------------------------------------
$("#stock_id").on('DataFound', (event, msg, data) => {
    $("#logmsg").css('color', 'green');
    $("#logmsg").html(msg);
    log("test : " + data.length);
    log(data);
    chart.dataProvider = data;
    chart.validateData();
});
//--------------------------------------------------
$("#stock_id").on('DataNotFound', (event, msg, data) => {
    $("#logmsg").css('color', 'red');
    $("#logmsg").html(msg);
});
//--------------------------------------------------
$("#stock_date").change(search);
//--------------------------------------------------

$(document).ready(function() {
    $('#example').DataTable( {
        "ajax":             "tables/data.txt",
        'aoColumns': [ 
            { sWidth: "50%", bSearchable: false, bSortable: true }, 
            { sWidth: "50%", bSearchable: false, bSortable: true }
        ],
        "bSort":            false,
        "scrollY":          "200px",
        "scrollCollapse":   false,
        "info":             false,
        "ordering":         true,
        "paging":           false,
        "searching":        false
    } );
} );