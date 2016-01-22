Handlebars.registerHelper('with', function(context, options) {
	const content = (function() {
		let results = [];
		for (let key in context) {
			results.push(options.fn({
				key: key,
				value: context[key],
				data: options.data.root,
			}));
		}

		return results;
	})();

	return content.join('');
});
