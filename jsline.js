function ResetMethod() {
    current_change = Change(8);
    current_bell = 0;
    current_row = 0;
}

function ShowNextBell() {
    var rowdiv;
    var newobj;

    if (current_bell == 0) {
	rowdiv = $('<div style="position: relative;"><br/></div>');
	$("#blueline").append(rowdiv);
    } else {
	rowdiv = $("#blueline > div").last()
    }
    newobj = $("<div>" + bell_names[current_change.row[current_bell]]
	    + "</div>");
    newobj.css({position:"absolute", left:current_bell * bell_width,
	    top:0});
    rowdiv.append(newobj);
    current_bell++;
    if (current_bell == current_change.rank) {
	current_bell = 0;
	current_row++;
	current_change.advance_row(current_method);
    }
}

$(document).ready(function(){
    var newobj;
    var i;

    $("#go").click(function(event){
	ShowNextBell();
    })

    bell_width = 16;
    bell_height = 16;

    current_method = Method(8, "Yorkshire",
	    parse_method_microsiril(8, "b", "&-3-4-5-6-3-4-7"));
    ResetMethod();
    for (i = 0; i < 32; i++) {
	$("#go").click();
    }
})

