"use strict";
exports.ids = [
    335
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.972.27/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromTokenFile: ()=>fromTokenFile
        });
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        var CredentialsProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js");
        var externalDataInterceptor = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/externalDataInterceptor.js");
        var external_node_fs_ = __webpack_require__("node:fs");
        const fromWebToken = (init)=>async (awsIdentityProperties)=>{
                init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromWebToken");
                const { roleArn, roleSessionName, webIdentityToken, providerId, policyArns, policy, durationSeconds } = init;
                let { roleAssumerWithWebIdentity } = init;
                if (!roleAssumerWithWebIdentity) {
                    const { getDefaultRoleAssumerWithWebIdentity } = await __webpack_require__.e(849).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sts/index.js"));
                    roleAssumerWithWebIdentity = getDefaultRoleAssumerWithWebIdentity({
                        ...init.clientConfig,
                        credentialProviderLogger: init.logger,
                        parentClientConfig: {
                            ...awsIdentityProperties?.callerClientConfig,
                            ...init.parentClientConfig
                        }
                    }, init.clientPlugins);
                }
                return roleAssumerWithWebIdentity({
                    RoleArn: roleArn,
                    RoleSessionName: roleSessionName ?? `aws-sdk-js-session-${Date.now()}`,
                    WebIdentityToken: webIdentityToken,
                    ProviderId: providerId,
                    PolicyArns: policyArns,
                    Policy: policy,
                    DurationSeconds: durationSeconds
                });
            };
        const ENV_TOKEN_FILE = "AWS_WEB_IDENTITY_TOKEN_FILE";
        const ENV_ROLE_ARN = "AWS_ROLE_ARN";
        const ENV_ROLE_SESSION_NAME = "AWS_ROLE_SESSION_NAME";
        const fromTokenFile = (init = {})=>async (awsIdentityProperties)=>{
                init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromTokenFile");
                const webIdentityTokenFile = init?.webIdentityTokenFile ?? process.env[ENV_TOKEN_FILE];
                const roleArn = init?.roleArn ?? process.env[ENV_ROLE_ARN];
                const roleSessionName = init?.roleSessionName ?? process.env[ENV_ROLE_SESSION_NAME];
                if (!webIdentityTokenFile || !roleArn) throw new CredentialsProviderError.C("Web identity configuration not specified", {
                    logger: init.logger
                });
                const credentials = await fromWebToken({
                    ...init,
                    webIdentityToken: externalDataInterceptor.Z?.getTokenRecord?.()[webIdentityTokenFile] ?? (0, external_node_fs_.readFileSync)(webIdentityTokenFile, {
                        encoding: "ascii"
                    }),
                    roleArn,
                    roleSessionName
                })(awsIdentityProperties);
                if (webIdentityTokenFile === process.env[ENV_TOKEN_FILE]) (0, setCredentialFeature.g)(credentials, "CREDENTIALS_ENV_VARS_STS_WEB_ID_TOKEN", "h");
                return credentials;
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
