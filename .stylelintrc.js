module.exports = {
	extends: ["stylelint-config-standard", "stylelint-config-prettier"],
	plugins: ["stylelint-no-unsupported-browser-features"],
	rules: {
		indentation: "tab",
		"selector-pseudo-class-no-unknown": [
			true,
			{
				ignorePseudoClasses: ["global"]
			}
		],
		"custom-property-empty-line-before": null,
		"plugin/no-unsupported-browser-features": [
			true,
			{
				severity: "warning",
				ignore: ["font-unicode-range", "css-resize", "css-appearance"]
			}
		],
		"declaration-empty-line-before": [
			"always",
			{
				except: ["after-declaration", "first-nested"],
				ignore: [
					"after-comment",
					"inside-single-line-block",
					"after-declaration"
				]
			}
		]
	}
};
