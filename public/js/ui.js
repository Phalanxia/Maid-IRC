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
