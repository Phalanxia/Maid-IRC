$(window).bind('beforeunload', function () {
	return "You have attempted to leave this page. Doing so will disconnect you from IRC.";
});

$('#shutdown footer button:last-child').click(function () {
	socket.emit('shutdown', "Kittens are kawaii.");
	$(window).unbind("beforeunload");
	window.location.href = document.location.origin;
});

$('#sidebar footer ul li:nth-of-type(1), #settings header button').click(function () {
	$("#pageCover, #settings").toggleClass("displayed");
});

$('#sidebar footer ul li:nth-of-type(2), #shutdown footer button:first-child').click(function () {
	$("#pageCover, #shutdown").toggleClass("displayed");
});

$("#pageCover").click(function () {
	$("#pageCover, .modal").removeClass("displayed");
});