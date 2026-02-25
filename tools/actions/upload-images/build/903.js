"use strict";
exports.ids = [
    "903"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-env@3.535.0/node_modules/@aws-sdk/credential-provider-env/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromEnv: ()=>fromEnv
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        const ENV_KEY = "AWS_ACCESS_KEY_ID";
        const ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
        const ENV_SESSION = "AWS_SESSION_TOKEN";
        const ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
        const ENV_CREDENTIAL_SCOPE = "AWS_CREDENTIAL_SCOPE";
        const fromEnv = (init)=>async ()=>{
                init?.logger?.debug("@aws-sdk/credential-provider-env", "fromEnv");
                const accessKeyId = process.env[ENV_KEY];
                const secretAccessKey = process.env[ENV_SECRET];
                const sessionToken = process.env[ENV_SESSION];
                const expiry = process.env[ENV_EXPIRATION];
                const credentialScope = process.env[ENV_CREDENTIAL_SCOPE];
                if (accessKeyId && secretAccessKey) return {
                    accessKeyId,
                    secretAccessKey,
                    ...sessionToken && {
                        sessionToken
                    },
                    ...expiry && {
                        expiration: new Date(expiry)
                    },
                    ...credentialScope && {
                        credentialScope
                    }
                };
                throw new dist_es.C1("Unable to find environment variable credentials.");
            };
    }
};
