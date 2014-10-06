var Templates = {
	messageSource: {
		source: '<ul class="message-source-list"><li class="server" data-server-id="{{serverid}}"><h2>{{serverName}}</h2></li>{{#each channels}}<li class="channel" data-server-id="" data-value="{{@key}}" data-number="{{@index}}" data-alert=""><i class="fa fa-comments-o"></i><span>{{@key}}</span></li>{{/each}}</ul>'
	},
	usersList: {
		source: '{{#each user}}<li><p data-rank="{{rank}}" data-rank-icon="{{rankIcon}}">{{@key}}</p></li>{{/each}}'
	},
	modal: {
		source: '<div class="modal"><header>{{Title}}<button type="button">&times;</button></header>{{> modalContent}}</div>'
	}
};

var Partials = {
	settingsPartial: '',
	connectPartial: ''
}

// Compile templates and save them back in the template object
for (var index in Templates) {
	Templates[index].compiled = Handlebars.compile(Templates[index].source);
}

// Register all partials
Handlebars.registerPartial(Partials);
