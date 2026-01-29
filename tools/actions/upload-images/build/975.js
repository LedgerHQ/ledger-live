"use strict";
exports.ids = [
    "975"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-ini@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-ini/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromIni: ()=>fromIni
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@2.4.0/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js");
        var property_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        const resolveCredentialSource = (credentialSource, profileName)=>{
            const sourceProvidersMap = {
                EcsContainer: (options)=>__webpack_require__.e("121").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@2.3.0/node_modules/@smithy/credential-provider-imds/dist-es/index.js")).then(({ fromContainerMetadata })=>fromContainerMetadata(options)),
                Ec2InstanceMetadata: (options)=>__webpack_require__.e("121").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@2.3.0/node_modules/@smithy/credential-provider-imds/dist-es/index.js")).then(({ fromInstanceMetadata })=>fromInstanceMetadata(options)),
                Environment: (options)=>__webpack_require__.e("903").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-env@3.535.0/node_modules/@aws-sdk/credential-provider-env/dist-es/index.js")).then(({ fromEnv })=>fromEnv(options))
            };
            if (credentialSource in sourceProvidersMap) return sourceProvidersMap[credentialSource];
            throw new property_provider_dist_es.C1(`Unsupported credential source in profile ${profileName}. Got ${credentialSource}, expected EcsContainer or Ec2InstanceMetadata or Environment.`);
        };
        const isAssumeRoleProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.role_arn && [
                "undefined",
                "string"
            ].indexOf(typeof arg.role_session_name) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.external_id) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.mfa_serial) > -1 && (isAssumeRoleWithSourceProfile(arg) || isAssumeRoleWithProviderProfile(arg));
        const isAssumeRoleWithSourceProfile = (arg)=>"string" == typeof arg.source_profile && void 0 === arg.credential_source;
        const isAssumeRoleWithProviderProfile = (arg)=>"string" == typeof arg.credential_source && void 0 === arg.source_profile;
        const resolveAssumeRoleCredentials = async (profileName, profiles, options, visitedProfiles = {})=>{
            options.logger?.debug("@aws-sdk/credential-provider-ini", "resolveAssumeRoleCredentials (STS)");
            const data = profiles[profileName];
            if (!options.roleAssumer) {
                const { getDefaultRoleAssumer } = await Promise.all([
                    __webpack_require__.e("675"),
                    __webpack_require__.e("858")
                ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-ini@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-ini/dist-es/loadSts.js"));
                options.roleAssumer = getDefaultRoleAssumer({
                    ...options.clientConfig,
                    credentialProviderLogger: options.logger,
                    parentClientConfig: options?.parentClientConfig
                }, options.clientPlugins);
            }
            const { source_profile } = data;
            if (source_profile && source_profile in visitedProfiles) throw new property_provider_dist_es.C1(`Detected a cycle attempting to resolve credentials for profile ${(0, dist_es.Bz)(options)}. Profiles visited: ` + Object.keys(visitedProfiles).join(", "), false);
            const sourceCredsProvider = source_profile ? resolveProfileData(source_profile, profiles, options, {
                ...visitedProfiles,
                [source_profile]: true
            }) : (await resolveCredentialSource(data.credential_source, profileName)(options))();
            const params = {
                RoleArn: data.role_arn,
                RoleSessionName: data.role_session_name || `aws-sdk-js-${Date.now()}`,
                ExternalId: data.external_id,
                DurationSeconds: parseInt(data.duration_seconds || "3600", 10)
            };
            const { mfa_serial } = data;
            if (mfa_serial) {
                if (!options.mfaCodeProvider) throw new property_provider_dist_es.C1(`Profile ${profileName} requires multi-factor authentication, but no MFA code callback was provided.`, false);
                params.SerialNumber = mfa_serial;
                params.TokenCode = await options.mfaCodeProvider(mfa_serial);
            }
            const sourceCreds = await sourceCredsProvider;
            return options.roleAssumer(sourceCreds, params);
        };
        const isProcessProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.credential_process;
        const resolveProcessCredentials = async (options, profile)=>__webpack_require__.e("632").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-process@3.535.0/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js")).then(({ fromProcess })=>fromProcess({
                    ...options,
                    profile
                })());
        const resolveSsoCredentials = async (profile, options = {})=>{
            const { fromSSO } = await __webpack_require__.e("817").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js"));
            return fromSSO({
                profile,
                logger: options.logger
            })();
        };
        const isSsoProfile = (arg)=>arg && ("string" == typeof arg.sso_start_url || "string" == typeof arg.sso_account_id || "string" == typeof arg.sso_session || "string" == typeof arg.sso_region || "string" == typeof arg.sso_role_name);
        const isStaticCredsProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.aws_access_key_id && "string" == typeof arg.aws_secret_access_key && [
                "undefined",
                "string"
            ].indexOf(typeof arg.aws_session_token) > -1;
        const resolveStaticCredentials = (profile, options)=>{
            options?.logger?.debug("@aws-sdk/credential-provider-ini", "resolveStaticCredentials");
            return Promise.resolve({
                accessKeyId: profile.aws_access_key_id,
                secretAccessKey: profile.aws_secret_access_key,
                sessionToken: profile.aws_session_token,
                credentialScope: profile.aws_credential_scope
            });
        };
        const isWebIdentityProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.web_identity_token_file && "string" == typeof arg.role_arn && [
                "undefined",
                "string"
            ].indexOf(typeof arg.role_session_name) > -1;
        const resolveWebIdentityCredentials = async (profile, options)=>__webpack_require__.e("166").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js")).then(({ fromTokenFile })=>fromTokenFile({
                    webIdentityTokenFile: profile.web_identity_token_file,
                    roleArn: profile.role_arn,
                    roleSessionName: profile.role_session_name,
                    roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
                    logger: options.logger,
                    parentClientConfig: options.parentClientConfig
                })());
        const resolveProfileData = async (profileName, profiles, options, visitedProfiles = {})=>{
            const data = profiles[profileName];
            if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isAssumeRoleProfile(data)) return resolveAssumeRoleCredentials(profileName, profiles, options, visitedProfiles);
            if (isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isWebIdentityProfile(data)) return resolveWebIdentityCredentials(data, options);
            if (isProcessProfile(data)) return resolveProcessCredentials(options, profileName);
            if (isSsoProfile(data)) return await resolveSsoCredentials(profileName, options);
            throw new property_provider_dist_es.C1(`Profile ${profileName} could not be found or parsed in shared credentials file.`);
        };
        const fromIni = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-ini", "fromIni");
                const profiles = await (0, dist_es.YU)(init);
                return resolveProfileData((0, dist_es.Bz)(init), profiles, init);
            };
    }
};
