var select = function (selectors) {
	if (selectors.indexOf(',') != -1) {
		return document.querySelectorAll(selectors);
	} else {
		return document.querySelector(selectors);
	}
};

var advanced = false;

select('a#advanced').onclick = function () {
	if (!advanced) {
		advanced = true;
		select('section:nth-of-type(2)').insertAdjacentHTML('afterend', '<section class="checkbox"><input id="ssl" type="checkbox" name="sslToggle"><span class="checkboxLabel">SSL</span></section>');
		select('section:nth-of-type(1)').insertAdjacentHTML('afterend', '<section class="bubble"><div class="nipple"><span></span></div><input id="nicknamePassword" type="password" placeholder="Password" name="nicknamePassword"></section><section class="bubble"><input id="realName" type="text" placeholder="Real Name" name="realName"></section>');
	}
};
