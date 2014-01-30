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

$('section:nth-of-type(3) span').click(function () {
	if (!$('#channelPassword').length) {
		$('section:nth-of-type(3)').after('<section class="password" id="channelPassword"><div class="nipple"><span></span></div><input type="password" placeholder="password" name="channelPassword"></section>');
	} else if ($('#channelPassword input').val("")) {
		$("#channelPassword").remove();
	}
});