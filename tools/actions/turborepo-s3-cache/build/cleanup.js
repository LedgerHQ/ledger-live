"use strict";
var __webpack_exports__ = {};
const core_namespaceObject = require("@actions/core");
const external_fs_namespaceObject = require("fs");
const external_path_namespaceObject = require("path");
const rootDirectory = process.env.GITHUB_WORKSPACE;
const cacheDirectory = ".turbo/cache";
const absoluteCacheDirectory = external_path_namespaceObject.resolve(rootDirectory, cacheDirectory);
const logFileName = "__turbo_server.log";
const pid = Number.parseInt((0, core_namespaceObject.getState)("pidToKill"));
const cleanupCacheFolder = "true" === (0, core_namespaceObject.getState)("cleanupCacheFolder");
(0, core_namespaceObject.info)("Server pid: " + pid);
try {
    if (!isNaN(pid)) process.kill(pid);
} catch (err) {
    console.error(err);
}
try {
    const logFilePath = external_path_namespaceObject.join(absoluteCacheDirectory, logFileName);
    if (external_fs_namespaceObject.existsSync(logFilePath)) {
        (0, core_namespaceObject.info)("Server logs:");
        (0, core_namespaceObject.info)(external_fs_namespaceObject.readFileSync(logFilePath, {
            encoding: "utf8",
            flag: "r"
        }));
    }
    if (cleanupCacheFolder) external_fs_namespaceObject.rmSync(absoluteCacheDirectory, {
        recursive: true
    });
} catch (err) {
    console.error(err);
}
for(var __rspack_i in __webpack_exports__)exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
