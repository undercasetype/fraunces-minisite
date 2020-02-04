const path = require("path");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);

const inputDir = path.resolve(__dirname, "..", "src");

const webpackAsset = async name => {
	const manifestData = await readFile(
		path.resolve(inputDir, "_includes", ".webpack", "manifest.json")
	);
	const manifest = JSON.parse(manifestData);

	const assetPath = manifest[name];
	if (assetPath == null) {
		throw new Error(
			`Unknown Webpack asset requested: ${name}. Check .webpack/manifest.json.`
		);
	}

	return assetPath;
};

const webpackAssetUrl = async (baseUrl, name) => {
	const path = await webpackAsset(name);

	const url = new URL(baseUrl);
	url.pathname = path;

	return url.toString();
};

const webpackAssetContents = async name => {
	const assetName = await webpackAsset(name);
	const filePath = path.resolve(__dirname, "..", "_site", assetName);

	return readFile(filePath);
};

module.exports = {
	webpackAsset,
	webpackAssetUrl,
	webpackAssetContents
};
