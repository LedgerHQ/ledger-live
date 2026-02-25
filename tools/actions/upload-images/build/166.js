"use strict";
exports.ids = [
    "166"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromTokenFile: ()=>fromTokenFile
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        var external_fs_ = __webpack_require__("fs");
        const fromWebToken = (init)=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-web-identity", "fromWebToken");
                const { roleArn, roleSessionName, webIdentityToken, providerId, policyArns, policy, durationSeconds } = init;
                let { roleAssumerWithWebIdentity } = init;
                if (!roleAssumerWithWebIdentity) {
                    const { getDefaultRoleAssumerWithWebIdentity } = await Promise.all([
                        __webpack_require__.e("675"),
                        __webpack_require__.e("450")
                    ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/loadSts.js"));
                    roleAssumerWithWebIdentity = getDefaultRoleAssumerWithWebIdentity({
                        ...init.clientConfig,
                        credentialProviderLogger: init.logger,
                        parentClientConfig: init.parentClientConfig
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
        const fromTokenFile = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-web-identity", "fromTokenFile");
                const webIdentityTokenFile = init?.webIdentityTokenFile ?? process.env[ENV_TOKEN_FILE];
                const roleArn = init?.roleArn ?? process.env[ENV_ROLE_ARN];
                const roleSessionName = init?.roleSessionName ?? process.env[ENV_ROLE_SESSION_NAME];
                if (!webIdentityTokenFile || !roleArn) throw new dist_es.C1("Web identity configuration not specified");
                return fromWebToken({
                    ...init,
                    webIdentityToken: (0, external_fs_.readFileSync)(webIdentityTokenFile, {
                        encoding: "ascii"
                    }),
                    roleArn,
                    roleSessionName
                })();
            };
    }
};
