import "../live-common-setup";

await import("../output");
const solanaSdkLoaded = Object.keys(require.cache).some(path =>
  path.replaceAll("\\", "/").includes("/node_modules/@solana/web3.js/"),
);
console.log(solanaSdkLoaded ? "loaded" : "not loaded");
