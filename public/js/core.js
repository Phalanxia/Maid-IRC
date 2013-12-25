// socket.io
var socket = io.connect('http://' + document.domain + ':4848', {
	'reconnect': true,
	'reconnection delay': 500
});

$(document).keyup(function (e) {
	if (e.keyCode == 13) {
		socket.emit('server', $('form #server')[0].value);
	}
});