"use strict";
var __webpack_exports__ = {};
const core_namespaceObject = require("@actions/core");
const external_child_process_namespaceObject = require("child_process");
const external_path_namespaceObject = require("path");
const external_fs_extra_namespaceObject = require("fs-extra");
const rootDirectory = process.env.GITHUB_WORKSPACE;
const cacheDirectory = ".turbo/cache";
const absoluteCacheDirectory = external_path_namespaceObject.resolve(rootDirectory, cacheDirectory);
const logFileName = "__turbo_server.log";
const portFileName = "__turbo_port.txt";
const cleanupCacheFolder = (0, core_namespaceObject.getInput)("cleanup-cache-folder", {
    required: true,
    trimWhitespace: true
});
(0, core_namespaceObject.saveState)("cleanupCacheFolder", cleanupCacheFolder);
(async ()=>{
    external_fs_extra_namespaceObject.ensureDirSync(absoluteCacheDirectory);
    const out = external_fs_extra_namespaceObject.openSync(external_path_namespaceObject.join(absoluteCacheDirectory, logFileName), "w");
    const err = external_fs_extra_namespaceObject.openSync(external_path_namespaceObject.join(absoluteCacheDirectory, logFileName), "a");
    const subprocess = (0, external_child_process_namespaceObject.spawn)("node", [
        external_path_namespaceObject.resolve(__dirname, "server.js")
    ], {
        detached: true,
        stdio: [
            "ignore",
            out,
            err
        ],
        env: {
            ...process.env,
            AWS_ACCESS_KEY_ID: (0, core_namespaceObject.getInput)("aws-access-key"),
            AWS_SECRET_ACCESS_KEY: (0, core_namespaceObject.getInput)("aws-secret-key"),
            AWS_SESSION_TOKEN: (0, core_namespaceObject.getInput)("aws-session-token")
        }
    });
    subprocess.unref();
    let interval = null;
    let timeout = null;
    try {
        await Promise.race([
            new Promise((resolve)=>{
                interval = setInterval(()=>{
                    if (external_fs_extra_namespaceObject.existsSync(external_path_namespaceObject.resolve(absoluteCacheDirectory, portFileName))) {
                        const port = external_fs_extra_namespaceObject.readFileSync(external_path_namespaceObject.resolve(absoluteCacheDirectory, portFileName)).toString();
                        (0, core_namespaceObject.info)(`Server port: ${port}`);
                        (0, core_namespaceObject.setOutput)("port", port);
                        resolve();
                    }
                }, 1000);
            }),
            new Promise((_, reject)=>{
                timeout = setTimeout(reject, 10000);
            })
        ]);
    } catch  {
        console.error("Timeout while waiting for the server to boot.");
    } finally{
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
    }
    (0, core_namespaceObject.info)(`Server PID: ${subprocess.pid}`);
    (0, core_namespaceObject.saveState)("pidToKill", subprocess.pid);
})();
for(var __rspack_i in __webpack_exports__)exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
