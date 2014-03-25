var select = function (selectors) {
	return document.querySelector(selectors);
};

var selectAll = function (selectors) {
	return document.querySelectorAll(selectors);
};

select('a#advanced').onclick = function () {
	[].map.call(selectAll('.advanced'), function(obj) {
		obj.style.display = 'block';
	});

	[].map.call(selectAll('input'), function(obj) {
		obj.tabIndex = '0';
	});

	select('hr.advanced').style.height = '0';
	select('a#advanced').style.display = 'none';
};
