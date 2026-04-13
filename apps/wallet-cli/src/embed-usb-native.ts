/**
 * Force Bun to embed the `usb` N-API native addon into the standalone binary.
 *
 * `usb` loads its native binding via node-gyp-build which uses dynamic path
 * resolution that Bun's bundler cannot detect at compile time.  A direct
 * require() makes Bun embed the .node file into the executable.
 *
 * With `minify: true`, Bun evaluates process.platform / process.arch as
 * compile-time constants for each --target, so only the matching prebuilt
 * ends up in each platform binary.
 *
 * @see https://bun.sh/docs/bundler/executables#embed-n-api-addons
 */

if (process.platform === "darwin") {
  require("../node_modules/usb/prebuilds/darwin-x64+arm64/node.napi.node");
} else if (process.platform === "linux" && process.arch === "x64") {
  require("../node_modules/usb/prebuilds/linux-x64/node.napi.glibc.node");
} else if (process.platform === "linux" && process.arch === "arm64") {
  require("../node_modules/usb/prebuilds/linux-arm64/node.napi.armv8.node");
} else if (process.platform === "win32") {
  require("../node_modules/usb/prebuilds/win32-x64/node.napi.node");
}
