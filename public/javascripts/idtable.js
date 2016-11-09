$(document).ready(function(){
  $('#example').DataTable( {
        "ajax": 'tables/idtable.ajax',
        "bSort":            false,
        "scrollY":          "240px",
        "scrollCollapse":   false,
        "info":             true,
        "ordering":         false,
        "paging":           true,
        "searching":        true
    } );
});