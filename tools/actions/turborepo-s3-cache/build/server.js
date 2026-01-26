"use strict";
var __webpack_require__ = {};
(()=>{
    __webpack_require__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __webpack_require__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
(()=>{
    __webpack_require__.d = (exports1, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
var __webpack_exports__ = {};
const core_namespaceObject = require("@actions/core");
const client_s3_namespaceObject = require("@aws-sdk/client-s3");
const lib_storage_namespaceObject = require("@aws-sdk/lib-storage");
const external_express_namespaceObject = require("express");
var external_express_default = /*#__PURE__*/ __webpack_require__.n(external_express_namespaceObject);
const external_path_namespaceObject = require("path");
const external_fs_namespaceObject = require("fs");
const external_stream_namespaceObject = require("stream");
const asyncHandler = (fn)=>(req, res, next)=>Promise.resolve(fn(req, res, next)).catch((err)=>next(err));
const rootDirectory = process.env.GITHUB_WORKSPACE;
const cacheDirectory = ".turbo/cache";
const absoluteCacheDirectory = external_path_namespaceObject.resolve(rootDirectory, cacheDirectory);
const portFileName = "__turbo_port.txt";
async function startServer() {
    const app = external_express_default()();
    const client = new client_s3_namespaceObject.S3Client({
        region: (0, core_namespaceObject.getInput)("region")
    });
    const bucket = (0, core_namespaceObject.getInput)("bucket-name");
    const serverToken = (0, core_namespaceObject.getInput)("server-token", {
        required: true,
        trimWhitespace: true
    });
    app.all("*", (req, res, next)=>{
        console.info(`Got a ${req.method} request`, req.path);
        const { authorization = "" } = req.headers;
        const [type = "", token = ""] = authorization.split(" ");
        if ("Bearer" !== type || token !== serverToken) return res.status(401).send("Unauthorized");
        next();
    });
    app.get("/v8/artifacts/:artifactId", asyncHandler(async (req, res)=>{
        const { artifactId } = req.params;
        const filename = artifactId + ".gz";
        const command = new client_s3_namespaceObject.GetObjectCommand({
            Bucket: bucket,
            Key: filename
        });
        try {
            const item = await client.send(command);
            console.log(`Artifact ${artifactId} streamed successfully`);
            return item?.Body?.pipe(res);
        } catch  {
            console.log(`Artifact ${artifactId} not found.`);
            return res.status(404).send("Not found");
        }
    }));
    app.put("/v8/artifacts/:artifactId", asyncHandler(async (req, res)=>{
        const artifactId = req.params.artifactId;
        const filename = `${artifactId}.gz`;
        const bodyStream = new external_stream_namespaceObject.PassThrough();
        bodyStream.on("error", (err)=>{
            console.error("Stream error:", err);
        });
        req.pipe(bodyStream);
        try {
            const upload = new lib_storage_namespaceObject.Upload({
                client,
                params: {
                    Bucket: bucket,
                    Key: filename,
                    Body: bodyStream
                }
            });
            await upload.done();
            return res.end();
        } catch  {
            return res.status(500).end();
        }
    }));
    app.post("/v8/artifacts/events", (req, res)=>{
        res.status(200).send();
    });
    const server = app.disable("etag").listen(0);
    server.once("listening", ()=>{
        const port = "" + server.address().port;
        console.log(`Cache dir: ${cacheDirectory}`);
        console.log(`Local Turbo server is listening at http://127.0.0.1:${port}`);
        external_fs_namespaceObject.writeFileSync(external_path_namespaceObject.resolve(absoluteCacheDirectory, portFileName), port);
    });
}
startServer().catch((error)=>{
    console.error(error);
    process.exit(1);
});
for(var __rspack_i in __webpack_exports__)exports[__rspack_i] = __webpack_exports__[__rspack_i];
Object.defineProperty(exports, '__esModule', {
    value: true
});
