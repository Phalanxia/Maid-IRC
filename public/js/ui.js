function resizeUI() {
	h = $('body').height();
	w = $('body').width();

	$('#sidebar').css({
		"height": h
	});

	$('#rightSide').css({
		"height": h,
		"width": w - 201
	});

	// Backups to make sure the layouts don't break >:
	$('#sidebar nav, #sidebar nav ul').css({
		"height": h - 130
	});

	$('#consoleOutput').css({
		"height": h - 144
	});

	$('#consoleInput, #consoleLeft, #consoleOutput').css({
		"width": w - (202 + $('#sidebar').width())
	});

	$('#users ul').css({
		"height": h - 164
	});

	$('#webConsole output').css({
		"height": $('#webConsole').height() - 40
	});
}

$(window).resize(function(){
	resizeUI();
});

// On loaded
$(function () {
	resizeUI();
});

$(window).bind('beforeunload', function () {
	return "You have attempted to leave this page. Doing so will disconnect you from IRC. \n Are you sure you want to exit this page?";
});

$('button#shutdown').click(function () {
	if (confirm("Are you sure you want to shutdown?")) {
		console.log("bye~");
		$(window).unbind("beforeunload");
		socket.emit('shutdown', "Ye");
	}
});
