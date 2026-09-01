const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");

config.resolver.unstable_enablePackageExports = false;

config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\.local\/state\/.*/,
  /\.local\/skills\/.*/,
];

module.exports = config;
