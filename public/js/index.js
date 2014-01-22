$('input[type=text]').focus(function () {
	$(this).parent().addClass('outline');
}).blur(function (){
	$(this).parent().removeClass('outline');
});