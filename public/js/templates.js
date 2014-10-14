var Templates = {
	messageSource: {
		source: '<ul class="message-source-list"><li class="server" data-server-id="{{connectionId}}" data-value="server"><h2>{{serverName}}</h2></li>{{#each sources}}<li class="channel" data-server-id="" data-value="{{@key}}" data-number="{{@index}}" data-alert=""><i class="fa fa-comments-o"></i><span>{{@key}}</span></li>{{/each}}</ul>'
	},
	usersList: {
		source: '{{#each user}}<li><p data-rank="{{rank}}" data-rank-icon="{{rankIcon}}">{{@key}}</p></li>{{/each}}'
	},
	message: {
		source: '<article class="consoleMessage" data-messageType="{{type}}" data-source="{{source}}"><aside><time>{{timestamp}}</time><span>{{head}}</span></aside><p>{{message}}</p></article><article class="filler"><div></div></article>'
	},
	modal: {
		source: '<div class="modal"><header>{{title}}<button type="button">&times;</button></header>{{> modalContent}}</div>'
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
