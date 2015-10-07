window.onbeforeunload = function() {
	if (client.status.connection) {
		return 'You have attempted to leave this page. Doing so will disconnect you from IRC.';
	}
};

select('#pageCover').onclick = function() {
	hideModals();
};

selectAll('.modal header button').forEach(obj => {
	obj.onclick = function() {
		hideModals();
	};
});

function hideModals() {
	select('#pageCover').classList.remove('displayed');
	[].map.call(selectAll('.modal'), function(obj) {
		obj.classList.remove('displayed');
	});
}

// Show settings modal.
select('#network-panel header button.fa-cog').onclick = function() {
	select('#pageCover').classList.add('displayed');
	select('#settings').classList.add('displayed');
};

// Show connect modal.
select('#network-panel header button.fa.fa-plus').onclick = function() {
	select('#pageCover').classList.add('displayed');
	select('#connect').classList.add('displayed');
};

// Settings
var settingsItems = select('#settings nav > ul').getElementsByTagName('li');
for (i = 0; i < settingsItems.length; i++) {
	settingsItems[i].i = i;
	settingsItems[i].onclick = function() {
		var theNumber = this.i;
		[].map.call(selectAll('#settings nav > ul li'), function(obj) {
			obj.classList.remove('focused');
		});

		select('#settings nav > ul li:nth-of-type(' + (theNumber + 1) + ')').classList.add('focused');

		selectAll('#settings .page').forEach(obj => {
			obj.style.display = 'none';
		});

		selectAll('#settings .page:nth-of-type(' + (theNumber + 1) + ')')[0].style.display = 'block';
	};
}

// Login Screen
var advanced = false;
select('#connect-basic footer button:last-child').onclick = function() {
	if (advanced) {
		select('#connect-advanced').classList.remove('animation-login-advanced');
		select('#connect-advanced').classList.add('animation-login-basic');

		[].map.call(selectAll('input'), function(obj) {
			obj.tabIndex = '1';
		});
	} else {
		select('#connect-advanced').style.display = 'block';

		// [].map.call(selectAll('input'), function(obj) {
		// 	obj.tabIndex = '0';
		// });
	}

	advanced = !advanced;
};
