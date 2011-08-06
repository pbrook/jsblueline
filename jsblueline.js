function ResetMethod() {
    current_change = Change(8);
    current_bell = 0;
    current_row = 0;
}

delta = PealSpeedToMS(3, 8);

function ShowNextBell() {
    var rowdiv;
    var newobj;
    var bell_num;

    if (current_bell == 0) {
	rowdiv = $('<div style="position: relative;"><br/></div>');
	$("#blueline").append(rowdiv);
    } else {
	rowdiv = $("#blueline > div").last();
    }
    bell_num = current_change.row[current_bell];
    var a = audio_samples[current_method.rank - (bell_num + 1)];
    a.pause();
    a.currentTime = 0;
    a.play();
    newobj = $("<div>" + bell_names[bell_num]
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
    var now = (new Date()).getTime();
    console.log(Math.round(last_time + delta - now));
    last_time = now;
}

function PealSpeedToMS(speed, rank)
{
    return speed * 60 * 60 * 1000 / (5040 * (rank + 0.5));
}

$(document).ready(function() {
    var newobj;
    var i;

    audio_samples = Array(12)
    for (i = 0; i < 12; i++) {
	audio_samples[i] = $('<audio src="audio/' + (i + 1).toString(10)
		+ '.ogg" preload="auto"/>')[0];
	audio_samples[i].load();
    }

    ringing = false
    $("#go").click(function(event) {
	var gobutton = $("#go");
	ringing = !ringing;
	if (ringing) {
	    last_time = (new Date()).getTime();
	    ShowNextBell();
	    interval_timer = setInterval(ShowNextBell,
		PealSpeedToMS(3.0, current_method.rank));
	    gobutton.text("Stop");
	} else {
	    clearInterval(interval_timer);
	    gobutton.text("Go");
	}
    });

    bell_width = 16;
    bell_height = 16;

    current_method = Method(8, "Yorkshire",
	    parse_method_microsiril(8, "b", "&-3-4-5-6-3-4-7"));
    ResetMethod();
})

