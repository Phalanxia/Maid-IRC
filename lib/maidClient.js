var maidClient = function (message, irc) {
	switch (message.rawCommand) {
		case "001":
			break;
		case "002":
			break;
		case "005":
			for (var i = data.args.length - 1; i >= 0; i--) {
				if (data.args[i].indexOf("NETWORK") != -1) {
					var networkName = data.args[i].split("NETWORK=")[1];
					socket.emit('networkName', networkName);
				}
			}
			break;
	}
};

module.exports = maidClient;
