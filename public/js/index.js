var select = function (selectors) {
	return document.querySelector(selectors);
};

var selectAll = function (selectors) {
	return document.querySelectorAll(selectors);
};

var advanced = false;
select('a.fa.fa-gear').onclick = function () {
	if (advanced) {
		[].map.call(selectAll('.advanced'), function(obj) {
			obj.style.display = 'none';
		});

		[].map.call(selectAll('input'), function(obj) {
			obj.tabIndex = '1';
		});

	} else {
		[].map.call(selectAll('.advanced'), function(obj) {
			obj.style.display = 'block';
		});

		[].map.call(selectAll('input'), function(obj) {
			obj.tabIndex = '0';
		});
	}

	advanced = !advanced;
};
