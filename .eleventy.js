const htmlmin = require("html-minifier");
const {
	webpackAsset,
	webpackAssetContents
} = require("./_tools/webpackHelpers");

module.exports = eleventyConfig => {
	eleventyConfig.setUseGitIgnore(false);

	eleventyConfig.addLiquidShortcode("webpackAsset", webpackAsset);
	eleventyConfig.addLiquidShortcode(
		"webpackAssetContents",
		webpackAssetContents
	);

	eleventyConfig.addFilter("json_stringify", JSON.stringify);

	if (process.env.ELEVENTY_ENV === "production") {
		eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
			if (outputPath.endsWith(".html")) {
				let minified = htmlmin.minify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true
				});
				return minified;
			}

			return content;
		});
	}

	return {
		dir: {
			input: "./src",
			layouts: "_layouts"
		}
	};
};
