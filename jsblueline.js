var current_change;
var current_bell;
var current_row;
var current_method;
var dummy_bell;
var dummy_rows;
var bell_width = 16;
var user_key;
var user_bell;
var user_row;
var actual_times;

function ResetMethod() {
    current_bell = 0;
    current_row = -1;
    displayed_rows = 0;
    current_change = null;
    user_row = -1;
    actual_times=[];
    $("#blueline").empty();
}

current_interval = PealSpeedToMS(3, 8);

function Now() {
    return (new Date()).getTime();
}

function SoundBell(bell_num) {
    var a = audio_samples[current_method.rank - (bell_num + 1)];
    a.pause();
    a.currentTime = 0;
    a.play();
}

function DisplayBell(rowdiv, bell_num, pos, color, zindex) {
    var newobj;
    if (pos > current_method.rank + 2) {
	return;
    }
    newobj = $("<div>" + bell_names[bell_num] + "</div>");
    newobj.css({position:"absolute", left:pos * bell_width,
		top:0, color:color, "z-index":zindex});
    rowdiv.append(newobj);
}

function RowStartTime(row) {
    var rank = current_method.rank;
    delta = current_interval * (rank * row + Math.floor(row / 2));
    return start_time + delta;
}

function AdvanceRow() {
    var obj;
    current_row++;
    displayed_rows++;
    obj = $('<div id=rowdiv' + current_row
	    + ' style="position: relative;"><br/></div>');
    $("#blueline").append(obj);
    if (displayed_rows > 8) {
	$("#rowdiv" + (current_row + 1 - displayed_rows)).slideUp();
	displayed_rows--;
    }
    actual_times.push(new Array(current_method.rank));
}

function ShowNextBell() {
    var rowdiv;
    var bell_num;
    var delta;
    var color;

    var now = Now();
    //console.log(Math.round(last_time + current_interval - now));
    last_time = now;

    if (dummy_bell) {
	dummy_bell = false;
	return;
    }

    rowdiv = $("#blueline > div").last();

    bell_num = current_change.row[current_bell];
    /* FIXME: Factor in ideal time somewhere?  */
    actual_times[current_row][bell_num] = -now;
    if (bell_num != user_bell) {
	SoundBell(bell_num);
	if (bell_num == 0) {
	    color = "#800000";
	} else {
	    color = "#000000";
	}
    } else {
	color = "#d0d0d0";
    }
    DisplayBell(rowdiv, bell_num, current_bell, color, 0);

    current_bell++;
    if (current_bell == current_change.rank) {
	current_bell = 0;
	AdvanceRow();
	if (dummy_row) {
	    dummy_row = false;
	} else {
	    current_change.advance_row(current_method);
	}
	if ((current_row & 1) == 0) {
	    dummy_bell = true;
	}
    }
}

function PealSpeedToMS(speed, rank) {
    return speed * 60 * 60 * 1000 / (5040 * (rank + 0.5));
}

function RingUserBell() {
    var now = Now();
    var row;
    var row_start;
    var rowdiv;

    SoundBell(user_bell);
    if (active != 1) {
	return;
    }
    //user_times.append(now);
    row = current_row;
    row_start = RowStartTime(row);
    if (now < row_start - current_interval) {
	row--;
	row_start = RowStartTime(row);
    } else {
	row = current_row;
    }
    if (row > user_row) {
	rowdiv = $("#rowdiv" + row);
	DisplayBell(rowdiv, user_bell, (now - row_start) / current_interval,
		    "#0000ff", 1);
	user_row = row;
	actual_times[row][user_bell] += now;
    }
}

function RankChanged() {
    var rank = parseInt($("#method_rank").val(), 10);
    var obj = $("#user_bell");
    var old_val;

    old_val = parseInt(obj.val(), 10);
    if (old_val > rank) {
	old_val = -1;
	obj.val(-1);
    }
    obj.children().slice(1).remove();
    for (i = 0; i < rank; i++) {
	obj.append("<option value=" + i + ">" + (i + 1) + "</option>");
    }
    if (old_val != -1) {
	obj.val(old_val);
    }
}

$(document).ready(function() {
    var i;

    audio_samples = Array(12);
    for (i = 0; i < 12; i++) {
	audio_samples[i] = $('<audio src="audio/' + (i + 1).toString(10)
		+ '.ogg" preload="auto"/>')[0];
	audio_samples[i].load();
    }

    active = 0
    $("#go").click(function(event) {
	var gobutton = $(this);
	if (active != 1) {
	    if (current_change === null) {
		var rank = parseInt($("#method_rank").val(), 10);
		current_change = Change(rank);
		current_method = Method(rank, "", parse_method(rank,
			$("#method_notation").val()));
		dummy_row = true;
		start_time = Now();
		AdvanceRow();
	    }
	    last_time = (new Date()).getTime();
	    ShowNextBell();
	    interval_timer = setInterval(ShowNextBell, current_interval);
	    gobutton.text("Stop");
	    active = 1;
	} else {
	    clearInterval(interval_timer);
	    gobutton.text("Go");
	    active = 2;
	}
    });

    $("#user_key").change(function(event) {
	var obj = $(this);
	var val = obj.val();
	user_key = val.toUpperCase().charCodeAt(0);
	if (user_key != val.charCodeAt(0)) {
	    obj.val(val);
	}
    });
    $("#user_key").change();

    $("#method_rank").change(function(event) {
	RankChanged();
    });
    RankChanged();

    $("#user_bell").change(function(event) {
	user_bell = parseInt($(this).val(), 10);
    });
    $("#user_bell").change();

    $("#reset").click(function(event) {
	if (active == 1) {
	    $("#go").click();
	}
	ResetMethod()
    });

    $(document).keydown(function(event) {
	if (event.which == user_key && user_bell >= 0) {
	    RingUserBell();
	}
    });

    ResetMethod();
})

