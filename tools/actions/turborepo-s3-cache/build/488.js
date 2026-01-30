"use strict";
exports.ids = [
    "488"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.649.0_@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromTokenFile: ()=>fromTokenFile
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js");
        var external_fs_ = __webpack_require__("fs");
        const fromWebToken = (init)=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromWebToken");
                const { roleArn, roleSessionName, webIdentityToken, providerId, policyArns, policy, durationSeconds } = init;
                let { roleAssumerWithWebIdentity } = init;
                if (!roleAssumerWithWebIdentity) {
                    const { getDefaultRoleAssumerWithWebIdentity } = await __webpack_require__.e("900").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/index.js"));
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
                init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromTokenFile");
                const webIdentityTokenFile = init?.webIdentityTokenFile ?? process.env[ENV_TOKEN_FILE];
                const roleArn = init?.roleArn ?? process.env[ENV_ROLE_ARN];
                const roleSessionName = init?.roleSessionName ?? process.env[ENV_ROLE_SESSION_NAME];
                if (!webIdentityTokenFile || !roleArn) throw new dist_es.C1("Web identity configuration not specified", {
                    logger: init.logger
                });
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
