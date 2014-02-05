$(window).bind('beforeunload', function () {
	return "You have attempted to leave this page. Doing so will disconnect you from IRC.";
});

$('button#shutdown').click(function () {
	if (confirm("Are you sure you want to shutdown?")) {
		console.log("bye~");
		$(window).unbind("beforeunload");
		socket.emit('shutdown', "Ye");
	}
});

$('#sidebar footer ul li:nth-of-type(1), #settings header button').click(function () {
	if ($('#settings').css("opacity") === 0) {
		$('#pageCover, #settings').show();
		$('#settings, #pageCover').css({
			"opacity": "1"
		});
		$('#settings').css({
			"top": "50%"
		});
	} else {
		$('#settings, #pageCover').css({
			"opacity": "0"
		});
		$('#settings').css({
			"top": "0%"
		});
		setTimeout(function () {
			$('#pageCover, #settings').hide();
		}, 1000);
	}
});
