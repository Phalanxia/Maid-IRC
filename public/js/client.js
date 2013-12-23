var client = {
	server: document.domain,
	status: {
		connection: false,
		pastDisconnect: false
	}
}

var socket = io.connect('http://' + client.server + ':4848', {
	'reconnect': true,
	'reconnection delay': 500
});

socket.on('connect', function () {
	client.status.connection = true;

	$('#connectionStatus').css('background-color','#4eaa46');
	$('#connectionStatus').html("Connected");

	console.log("Connected to backend.");
});

socket.on('disconnect', function () {
	client.status.connection = false;
	client.status.pastDisconnect = true;
	
	$('#connectionStatus').css('background-color','#c83c3c');
	$('#connectionStatus').html("Disconnected");

	console.warn("Lost connection to backend.");
});