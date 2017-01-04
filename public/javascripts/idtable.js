$(document).ready(function(){
  $('#example').DataTable( {
        "ajax": 'tables/idtable.ajax',
		'aoColumns': [
		    { sWidth: "20%", bSearchable: true, bSortable: true },
            { sWidth: "40%", bSearchable: true, bSortable: false },
            { sWidth: "30%", bSearchable: true, bSortable: true }
		],
        "bSort":            false,
        "scrollY":          "240px",
        "scrollCollapse":   false,
        "info":             true,
        "ordering":         true,
        "paging":           true,
        "searching":        true
    } );
});
