const { webpackAssetPath } = require("../../.eleventy");
const path = require("path");

const siteAbsUrl = "https://fraunces.undercase.xyz";

const absAssetUrl = async assetPath => {
	const assetFilePath = await webpackAssetPath(assetPath);
	const asset = path.resolve("/", assetFilePath);
	return `${siteAbsUrl}${asset}`;
};

module.exports = async () => ({
	title: "Fraunces by Undercase Type",
	description:
		'Fraunces is a display, "Old Style" soft-serif typeface inspired by the mannerisms of early 20th century typefaces such as Windsor, Souvenir, and the Cooper Series.',

	// More info: https://css-tricks.com/essential-meta-tags-social-media/
	metatags: [
		{
			property: "og:title",
			content: "Fraunces by Undercase Type"
		},
		{
			property: "og:description",
			content:
				"Fraunces is a display, 'Old Style' soft-serif typeface inspired by the mannerisms of early 20th century typefaces such as Windsor, Souvenir, and the Cooper Series."
		},
		{
			property: "og:image",
			content: await absAssetUrl("img/fraunces_site.png")
		},
		{
			property: "og:url",
			content: siteAbsUrl
		},
		{
			property: "og:site_name",
			content: "Fraunces by Undercase Type"
		},
		{
			name: "twitter:card",
			content: "Fraunces"
		},
		{
			name: "twitter:image:alt",
			content: "Fraunces by Undercase Type"
		}
	]
});
