$('input[type=text]').focus(function () {
	$(this).parent().addClass('outline');
}).blur(function (){
	$(this).parent().removeClass('outline');
});

$('input[type=password]').focus(function () {
	$(this).parent().addClass('outline');
}).blur(function (){
	$(this).parent().removeClass('outline');
});

var advanced = false;

$('a#advanced').click(function () {
	if (!advanced) {
		advanced = true;
		$('section:nth-of-type(2)').after('<section class="checkbox"><input id="ssl" type="checkbox" name="sslToggle"><span class="checkboxLabel">SSL</span></section>');
		$('section:nth-of-type(1)').after('<section class="bubble"><div class="nipple"><span></span></div><input id="nicknamePassword" type="password" placeholder="Password" name="nicknamePassword"></section><section class="bubble"><input id="realName" type="text" placeholder="Real Name" name="realName"></section>');
	}
});
