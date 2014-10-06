window.onbeforeunload = function () {
	if (client.status.connection) {
		return "You have attempted to leave this page. Doing so will disconnect you from IRC.";
	}
};

select("#pageCover").onclick = function () {
	hideModals();
};

[].map.call(selectAll(".modal header button"), function (obj) {
	obj.onclick = function () {
		hideModals();
	};
});

// Show settings modal.
select('#network-panel header button').onclick = function () {
	select("#pageCover").classList.add("displayed");
	select("#settings").classList.add("displayed");
};

// Show connect modal.
select('#network-panel footer > button').onclick = function () {
	select("#pageCover").classList.add("displayed");
	select("#login").classList.add("displayed");
};

// Settings
var settingsItems = select('#settings.modal nav > ul').getElementsByTagName('li');
for (i = 0; i < settingsItems.length; i++) {
	settingsItems[i].i = i;
	settingsItems[i].onclick = function () {
		var theNumber = this.i;
		[].map.call(selectAll('#settings.modal nav > ul li'), function(obj) {
			obj.classList.remove('focused');
		});

		select('#settings.modal nav > ul li:nth-of-type(' + (theNumber+1) + ')').classList.add('focused');

		[].map.call(selectAll('#settings.modal .page'), function(obj) {
			obj.style.display = 'none';
		});

		selectAll('#settings.modal .page:nth-of-type(' + (theNumber+1) + ')')[0].style.display = 'block';
	};
}

// Login Screen
var advanced = false;
select('#login-basic footer button:last-child').onclick = function () {
	if (advanced) {
		select('#login-advanced').classList.remove('animation-login-advanced');
		select('#login-advanced').classList.add('animation-login-basic');

		[].map.call(selectAll('input'), function(obj) {
			obj.tabIndex = '1';
		});
	} else {
		select('#login-advanced').style.display = 'block';
		// [].map.call(selectAll('input'), function(obj) {
		// 	obj.tabIndex = '0';
		// });
	}

	advanced = !advanced;
};
