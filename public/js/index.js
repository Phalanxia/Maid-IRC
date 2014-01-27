$('input[type=text]').focus(function () {
	$(this).parent().addClass('outline');
}).blur(function (){
	$(this).parent().removeClass('outline');
});

$('section:nth-of-type(3) span').click(function () {
	if (!$('#channelPassword').length) {
		$('section:nth-of-type(3)').after('<input id="channelPassword" type="password" placeholder="password" name="channelPassword">');
	} else if ($('#channelPassword').val("")) {
		$("#channelPassword").remove();
	}
});