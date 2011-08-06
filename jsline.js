$(document).ready(function(){
    $("#go").click(function(event){
	var newobj = $("<div>42</div>");
	$("#blueline").append(newobj);
	newobj.css({position:"absolute", left:100, top:0});
    })
})

