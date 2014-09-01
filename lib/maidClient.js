var maidClient = function (message, irc, socket) {
	switch (message.rawCommand) {
		case "001":
			break;
		case "002":
			break;
		case "005":
			for (var i = message.args.length - 1; i >= 0; i--) {
				if (message.args[i].indexOf("NETWORK") != -1) {
					var networkName = message.args[i].split("NETWORK=")[1];
					socket.emit('networkName', networkName);
				}
			}
			break;
	}
};

module.exports = maidClient;
