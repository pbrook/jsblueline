var current_change;
var current_bell;
var current_row;
var current_method;
var current_delta;
var dummy_bell;
var dummy_rows;
var bell_width = 16;
var user_rows;
var actual_times;
var start_time;
var num_users = 0;
var user_default_keys = ['L', 'J'];
var user_keys = [0, 0];
var user_bells = [-1, -1];

function ResetMethod() {
    current_bell = 0;
    current_row = -1;
    displayed_rows = 0;
    current_delta = 0;
    current_change = null;
    user_rows = [-1, -1];
    actual_times=[];
    $("#blueline").empty();
}

current_interval = PealSpeedToMS(2.5, 8);

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
    /* Nasty hack to compensate for timer drift.
       Adjust by half the average error.  */
    //console.log(current_delta);
    start_time += current_delta / (current_method.rank * 2);
    current_delta = 0;
}

function ShowNextBell() {
    var rowdiv;
    var bell_num;
    var delta;
    var color;
    var real_time;

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
    real_time = RowStartTime(current_row);
    real_time += current_bell * current_interval;
    if (bell_num != user_bells[0] && bell_num != user_bells[1]) {
	real_time = now - real_time;
	actual_times[current_row][bell_num] = real_time;
	current_delta += real_time;
	SoundBell(bell_num);
	if (bell_num == 0) {
	    color = "#ff0000";
	} else {
	    color = "#000000";
	}
    } else {
	actual_times[current_row][bell_num] = -real_time;
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

function RingUserBell(i) {
    var now = Now();
    var row;
    var row_start;
    var rowdiv;
    var delta;

    SoundBell(user_bells[i]);
    if (active != 1) {
	return;
    }
    //user_times.append(now);
    row = current_row;
    row_start = RowStartTime(row);
    delta = current_interval / 2;
    if (now < row_start - delta) {
	row--;
	row_start = RowStartTime(row);
    }
    if (row > user_rows[i]) {
	rowdiv = $("#rowdiv" + row);
	DisplayBell(rowdiv, user_bells[i], (now - row_start) / current_interval,
		    "#0000ff", 1);
	user_rows[i] = row;
	actual_times[row][user_bells[i]] += now;
    }
}

function RankChanged() {
    var rank = parseInt($("#method_rank").val(), 10);
    var obj;
    var old_val;
    var i;
    var n;

    for (n = 0; n < num_users; n++) {
	obj = $("#user_bell" + n);
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
}

function UserChanged(event) {
    var obj;
    var val;

    RankChanged();
    if (num_users > 0) {
	user_bells[0] = parseInt($("#user_bell0").val(), 10);
	obj = $("#user_key0");
	val = obj.val();
	user_keys[0] = val.toUpperCase().charCodeAt(0);
	if (user_keys[0] != val.charCodeAt(0)) {
	    obj.val(val);
	}
    }
    if (num_users > 1) {
	user_bells[1] = parseInt($("#user_bell1").val(), 10);
	obj = $("#user_key1");
	val = obj.val();
	user_keys[1] = val.toUpperCase().charCodeAt(0);
	if (user_keys[1] != val.charCodeAt(0)) {
	    obj.val(val);
	}
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

    $("#method_rank").change(function(event) {
	RankChanged();
    });

    $("#user_add").click(function (event) {
	s = '<div id="user' + num_users + '">';
	s += 'Bell: <select id="user_bell' + num_users
	    + '"><option value="-1">None</option></select>';
	s += 'Key: <input id="user_key' + num_users
	    + '" value="' + user_default_keys[num_users]
	    + '" maxLength="1" size="1"/><br/>';
	s += '</div>';
	$("#user_controls").append(s);
	$("#user_bell" + num_users).change(UserChanged);
	$("#user_key" + num_users).change(UserChanged);
	num_users++;
	UserChanged();
	if (num_users == 2) {
	    $(this).attr('disabled', 'disabled')
	}
    });

    $("#reset").click(function(event) {
	if (active == 1) {
	    $("#go").click();
	}
	ResetMethod()
    });

    $(document).keydown(function(event) {
	for (i = 0; i < num_users; i++) {
	    if (event.which == user_keys[i] && user_bells[i] >= 0) {
		RingUserBell(i);
	    }
	}
    });

    ResetMethod();
})

