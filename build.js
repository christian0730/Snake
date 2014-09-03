// this is a requirejs build config file

({
	shim: {
		'../lib/jquery-2.1.1': {
			exports: '$'
		},
		'../lib/keymaster': {
			exports: 'key'
		},
		'../lib/underscore': {
			exports: '_'
		}
	},
	baseUrl: "src",
	name: "main",
	out: "dist/main.js",
	removeCombined: true
})