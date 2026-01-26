"use strict";
exports.ids = [
    "632"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-process@3.535.0/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromProcess: ()=>fromProcess
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@2.4.0/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js");
        var property_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        var external_child_process_ = __webpack_require__("child_process");
        var external_util_ = __webpack_require__("util");
        const getValidatedProcessCredentials = (profileName, data)=>{
            if (1 !== data.Version) throw Error(`Profile ${profileName} credential_process did not return Version 1.`);
            if (void 0 === data.AccessKeyId || void 0 === data.SecretAccessKey) throw Error(`Profile ${profileName} credential_process returned invalid credentials.`);
            if (data.Expiration) {
                const currentTime = new Date();
                const expireTime = new Date(data.Expiration);
                if (expireTime < currentTime) throw Error(`Profile ${profileName} credential_process returned expired credentials.`);
            }
            return {
                accessKeyId: data.AccessKeyId,
                secretAccessKey: data.SecretAccessKey,
                ...data.SessionToken && {
                    sessionToken: data.SessionToken
                },
                ...data.Expiration && {
                    expiration: new Date(data.Expiration)
                },
                ...data.CredentialScope && {
                    credentialScope: data.CredentialScope
                }
            };
        };
        const resolveProcessCredentials = async (profileName, profiles)=>{
            const profile = profiles[profileName];
            if (profiles[profileName]) {
                const credentialProcess = profile["credential_process"];
                if (void 0 !== credentialProcess) {
                    const execPromise = (0, external_util_.promisify)(external_child_process_.exec);
                    try {
                        const { stdout } = await execPromise(credentialProcess);
                        let data;
                        try {
                            data = JSON.parse(stdout.trim());
                        } catch  {
                            throw Error(`Profile ${profileName} credential_process returned invalid JSON.`);
                        }
                        return getValidatedProcessCredentials(profileName, data);
                    } catch (error) {
                        throw new property_provider_dist_es.C1(error.message);
                    }
                }
                throw new property_provider_dist_es.C1(`Profile ${profileName} did not contain credential_process.`);
            }
            throw new property_provider_dist_es.C1(`Profile ${profileName} could not be found in shared credentials file.`);
        };
        const fromProcess = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-process", "fromProcess");
                const profiles = await (0, dist_es.YU)(init);
                return resolveProcessCredentials((0, dist_es.Bz)(init), profiles);
            };
    }
};
