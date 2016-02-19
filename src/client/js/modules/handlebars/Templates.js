'use strict';

Handlebars.registerHelper('with', function withHelper(context, options) {
	const content = (() => {
		const results = [];
		for (const key in context) {
			if (key) {
				results.push(options.fn({
					key,
					value: context[key],
					data: options.data.root,
				}));
			}
		}

		return results;
	})();

	return content.join('');
});
