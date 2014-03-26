window.onbeforeunload = function () {
	return "You have attempted to leave this page. Doing so will disconnect you from IRC.";
};

selectAll('#sidebar header ul li')[0].onclick = function () {
	select("#pageCover").classList.toggle("displayed");
	select("#settings").classList.toggle("displayed");
};

selectAll('#settings.modal header button')[0].onclick = function () {
	select("#pageCover").classList.toggle("displayed");
	select("#settings").classList.toggle("displayed");
};

selectAll('#sidebar header ul li')[1].onclick = function () {
	select("#pageCover").classList.toggle("displayed");
	select("#shutdown").classList.toggle("displayed");
};

select("#pageCover").onclick = function () {
	select("#pageCover").classList.remove("displayed");
	[].map.call(selectAll(".modal"), function(obj) {
		obj.classList.remove("displayed");
	});
};

select("#shutdown.modal.alert button").onclick = function () {
	select("#pageCover").classList.toggle("displayed");
	select("#shutdown").classList.toggle("displayed");
};

selectAll("#shutdown.modal.alert button")[1].onclick = function () {
	socket.emit('shutdown', {});
	window.onbeforeunload = null;
	window.location.href = document.location.origin;
};

select('html').onclick = function () {
	select('#sidebar header ul').style.display = 'none';
};

select('#sidebar header ul').onclick = function (event) {
	event.stopPropagation();
};

select('#sidebar header button').onclick = function () {
	event.stopPropagation();
	if (select('#sidebar header ul').style.display == 'none' || select('#sidebar header ul').style.display === '') {
		select('#sidebar header ul').style.display = 'block';
	} else {
		select('#sidebar header ul').style.display = 'none';
	}
};
