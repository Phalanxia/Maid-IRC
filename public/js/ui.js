window.onbeforeunload = function () {
	return "You have attempted to leave this page. Doing so will disconnect you from IRC.";
};

select('#shutdown footer button:last-child').onclick = function () {
	socket.emit('shutdown', "Kittens are kawaii.");
	window.onbeforeunload = null;
	window.location.href = document.location.origin;
};

select('#sidebar footer ul li:nth-of-type(1), #settings header button').onclick = function () {
	select("#pageCover, #settings").classlist.toggle("displayed");
};

select('#sidebar footer ul li:nth-of-type(2), #shutdown footer button:first-child').onclick = (function () {
	select("#pageCover, #shutdown").classlist.toggle("displayed");
});

select("#pageCover").onclick = function () {
	select("#pageCover, .modal").classlist.remove("displayed");
};
