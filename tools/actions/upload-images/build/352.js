"use strict";
exports.ids = [
    352
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-process@3.972.24/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromProcess: ()=>fromProcess
        });
        var parseKnownFiles = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js");
        var getProfileName = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js");
        var CredentialsProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js");
        var externalDataInterceptor = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/externalDataInterceptor.js");
        var external_node_child_process_ = __webpack_require__("node:child_process");
        var external_node_util_ = __webpack_require__("node:util");
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        const getValidatedProcessCredentials = (profileName, data, profiles)=>{
            if (1 !== data.Version) throw Error(`Profile ${profileName} credential_process did not return Version 1.`);
            if (void 0 === data.AccessKeyId || void 0 === data.SecretAccessKey) throw Error(`Profile ${profileName} credential_process returned invalid credentials.`);
            if (data.Expiration) {
                const currentTime = new Date();
                const expireTime = new Date(data.Expiration);
                if (expireTime < currentTime) throw Error(`Profile ${profileName} credential_process returned expired credentials.`);
            }
            let accountId = data.AccountId;
            if (!accountId && profiles?.[profileName]?.aws_account_id) accountId = profiles[profileName].aws_account_id;
            const credentials = {
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
                },
                ...accountId && {
                    accountId
                }
            };
            (0, setCredentialFeature.g)(credentials, "CREDENTIALS_PROCESS", "w");
            return credentials;
        };
        const resolveProcessCredentials = async (profileName, profiles, logger)=>{
            const profile = profiles[profileName];
            if (profiles[profileName]) {
                const credentialProcess = profile["credential_process"];
                if (void 0 !== credentialProcess) {
                    const execPromise = (0, external_node_util_.promisify)(externalDataInterceptor.Z?.getTokenRecord?.().exec ?? external_node_child_process_.exec);
                    try {
                        const { stdout } = await execPromise(credentialProcess);
                        let data;
                        try {
                            data = JSON.parse(stdout.trim());
                        } catch  {
                            throw Error(`Profile ${profileName} credential_process returned invalid JSON.`);
                        }
                        return getValidatedProcessCredentials(profileName, data, profiles);
                    } catch (error) {
                        throw new CredentialsProviderError.C(error.message, {
                            logger
                        });
                    }
                }
                throw new CredentialsProviderError.C(`Profile ${profileName} did not contain credential_process.`, {
                    logger
                });
            }
            throw new CredentialsProviderError.C(`Profile ${profileName} could not be found in shared credentials file.`, {
                logger
            });
        };
        const fromProcess = (init = {})=>async ({ callerClientConfig } = {})=>{
                init.logger?.debug("@aws-sdk/credential-provider-process - fromProcess");
                const profiles = await (0, parseKnownFiles.Y)(init);
                return resolveProcessCredentials((0, getProfileName.Bz)({
                    profile: init.profile ?? callerClientConfig?.profile
                }), profiles, init.logger);
            };
    },
    "../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/externalDataInterceptor.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        var _getSSOTokenFromFile__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFromFile.js");
        var _readFile__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js");
        const externalDataInterceptor = {
            getFileRecord () {
                return _readFile__rspack_import_0.Jj;
            },
            interceptFile (path, contents) {
                _readFile__rspack_import_0.Jj[path] = Promise.resolve(contents);
            },
            getTokenRecord () {
                return _getSSOTokenFromFile__rspack_import_1.a;
            },
            interceptToken (id, contents) {
                _getSSOTokenFromFile__rspack_import_1.a[id] = contents;
            }
        };
        __webpack_require__.d(__webpack_exports__, {}, {
            Z: externalDataInterceptor
        });
    },
    "../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        var crypto__rspack_import_0 = __webpack_require__("crypto");
        var path__rspack_import_1 = __webpack_require__("path");
        var _getHomeDir__rspack_import_2 = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js");
        const getSSOTokenFilepath = (id)=>{
            const hasher = (0, crypto__rspack_import_0.createHash)("sha1");
            const cacheName = hasher.update(id).digest("hex");
            return (0, path__rspack_import_1.join)((0, _getHomeDir__rspack_import_2.R)(), ".aws", "sso", "cache", `${cacheName}.json`);
        };
        __webpack_require__.d(__webpack_exports__, {}, {
            C: getSSOTokenFilepath
        });
    },
    "../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFromFile.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        var fs_promises__rspack_import_0 = __webpack_require__("fs/promises");
        var _getSSOTokenFilepath__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js");
        const tokenIntercept = {};
        const getSSOTokenFromFile = async (id)=>{
            if (tokenIntercept[id]) return tokenIntercept[id];
            const ssoTokenFilepath = (0, _getSSOTokenFilepath__rspack_import_1.C)(id);
            const ssoTokenText = await (0, fs_promises__rspack_import_0.readFile)(ssoTokenFilepath, "utf8");
            return JSON.parse(ssoTokenText);
        };
        __webpack_require__.d(__webpack_exports__, {}, {
            a: tokenIntercept,
            v: getSSOTokenFromFile
        });
    }
};
