var Templates = {
	messageSource: {
		source: '<ul id="channel-list"><li class="server"><h2>{{serverName}}</h2></li>{{#each channels}}<li class="channel" data-alert="" data-channelNumber="{{@index}}"><i class="fa fa-comments-o"></i><span>{{@key}}</span></li>{{/each}}</ul>'
	}
};

for (var index in Templates) {
	Templates[index].compiled = Handlebars.compile(Templates[index].source);
}
