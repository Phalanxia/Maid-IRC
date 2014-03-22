document.querySelector('a#advanced').onclick = function () {
	for (var i = document.querySelectorAll('.advanced').length - 1; i >= 0; i--) {
		document.querySelectorAll('.advanced')[i].style.display = 'block';
	}

	for (var i = document.querySelectorAll('input').length - 1; i >= 0; i--) {
		document.querySelectorAll('input')[i].tabIndex = '0';
	}

	document.querySelector('a#advanced').style.display = 'none';
};
