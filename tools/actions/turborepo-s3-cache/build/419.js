"use strict";
exports.ids = [
    "419"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-ini@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+clie_b394f6d77bb8c04e31f472f90a6bf957/node_modules/@aws-sdk/credential-provider-ini/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromIni: ()=>fromIni
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@3.1.5/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js");
        var property_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js");
        const resolveCredentialSource = (credentialSource, profileName, logger)=>{
            const sourceProvidersMap = {
                EcsContainer: async (options)=>{
                    const { fromHttp } = await __webpack_require__.e("544").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-http@3.649.0/node_modules/@aws-sdk/credential-provider-http/dist-es/index.js"));
                    const { fromContainerMetadata } = await __webpack_require__.e("804").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/index.js"));
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is EcsContainer");
                    return (0, property_provider_dist_es.cy)(fromHttp(options ?? {}), fromContainerMetadata(options));
                },
                Ec2InstanceMetadata: async (options)=>{
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is Ec2InstanceMetadata");
                    const { fromInstanceMetadata } = await __webpack_require__.e("804").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/index.js"));
                    return fromInstanceMetadata(options);
                },
                Environment: async (options)=>{
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is Environment");
                    const { fromEnv } = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-env@3.649.0/node_modules/@aws-sdk/credential-provider-env/dist-es/index.js"));
                    return fromEnv(options);
                }
            };
            if (credentialSource in sourceProvidersMap) return sourceProvidersMap[credentialSource];
            throw new property_provider_dist_es.C1(`Unsupported credential source in profile ${profileName}. Got ${credentialSource}, expected EcsContainer or Ec2InstanceMetadata or Environment.`, {
                logger
            });
        };
        const isAssumeRoleProfile = (arg, { profile = "default", logger } = {})=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.role_arn && [
                "undefined",
                "string"
            ].indexOf(typeof arg.role_session_name) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.external_id) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.mfa_serial) > -1 && (isAssumeRoleWithSourceProfile(arg, {
                profile,
                logger
            }) || isCredentialSourceProfile(arg, {
                profile,
                logger
            }));
        const isAssumeRoleWithSourceProfile = (arg, { profile, logger })=>{
            const withSourceProfile = "string" == typeof arg.source_profile && void 0 === arg.credential_source;
            if (withSourceProfile) logger?.debug?.(`    ${profile} isAssumeRoleWithSourceProfile source_profile=${arg.source_profile}`);
            return withSourceProfile;
        };
        const isCredentialSourceProfile = (arg, { profile, logger })=>{
            const withProviderProfile = "string" == typeof arg.credential_source && void 0 === arg.source_profile;
            if (withProviderProfile) logger?.debug?.(`    ${profile} isCredentialSourceProfile credential_source=${arg.credential_source}`);
            return withProviderProfile;
        };
        const resolveAssumeRoleCredentials = async (profileName, profiles, options, visitedProfiles = {})=>{
            options.logger?.debug("@aws-sdk/credential-provider-ini - resolveAssumeRoleCredentials (STS)");
            const data = profiles[profileName];
            if (!options.roleAssumer) {
                const { getDefaultRoleAssumer } = await __webpack_require__.e("900").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/index.js"));
                options.roleAssumer = getDefaultRoleAssumer({
                    ...options.clientConfig,
                    credentialProviderLogger: options.logger,
                    parentClientConfig: options?.parentClientConfig
                }, options.clientPlugins);
            }
            const { source_profile } = data;
            if (source_profile && source_profile in visitedProfiles) throw new property_provider_dist_es.C1(`Detected a cycle attempting to resolve credentials for profile ${(0, dist_es.Bz)(options)}. Profiles visited: ` + Object.keys(visitedProfiles).join(", "), {
                logger: options.logger
            });
            options.logger?.debug(`@aws-sdk/credential-provider-ini - finding credential resolver using ${source_profile ? `source_profile=[${source_profile}]` : `profile=[${profileName}]`}`);
            const sourceCredsProvider = source_profile ? resolveProfileData(source_profile, profiles, options, {
                ...visitedProfiles,
                [source_profile]: true
            }, isCredentialSourceWithoutRoleArn(profiles[source_profile] ?? {})) : (await resolveCredentialSource(data.credential_source, profileName, options.logger)(options))();
            if (isCredentialSourceWithoutRoleArn(data)) return sourceCredsProvider;
            {
                const params = {
                    RoleArn: data.role_arn,
                    RoleSessionName: data.role_session_name || `aws-sdk-js-${Date.now()}`,
                    ExternalId: data.external_id,
                    DurationSeconds: parseInt(data.duration_seconds || "3600", 10)
                };
                const { mfa_serial } = data;
                if (mfa_serial) {
                    if (!options.mfaCodeProvider) throw new property_provider_dist_es.C1(`Profile ${profileName} requires multi-factor authentication, but no MFA code callback was provided.`, {
                        logger: options.logger,
                        tryNextLink: false
                    });
                    params.SerialNumber = mfa_serial;
                    params.TokenCode = await options.mfaCodeProvider(mfa_serial);
                }
                const sourceCreds = await sourceCredsProvider;
                return options.roleAssumer(sourceCreds, params);
            }
        };
        const isCredentialSourceWithoutRoleArn = (section)=>!section.role_arn && !!section.credential_source;
        const isProcessProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.credential_process;
        const resolveProcessCredentials = async (options, profile)=>__webpack_require__.e("552").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-process@3.649.0/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js")).then(({ fromProcess })=>fromProcess({
                    ...options,
                    profile
                })());
        const resolveSsoCredentials = async (profile, options = {})=>{
            const { fromSSO } = await __webpack_require__.e("769").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js"));
            return fromSSO({
                profile,
                logger: options.logger
            })();
        };
        const isSsoProfile = (arg)=>arg && ("string" == typeof arg.sso_start_url || "string" == typeof arg.sso_account_id || "string" == typeof arg.sso_session || "string" == typeof arg.sso_region || "string" == typeof arg.sso_role_name);
        const isStaticCredsProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.aws_access_key_id && "string" == typeof arg.aws_secret_access_key && [
                "undefined",
                "string"
            ].indexOf(typeof arg.aws_session_token) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.aws_account_id) > -1;
        const resolveStaticCredentials = (profile, options)=>{
            options?.logger?.debug("@aws-sdk/credential-provider-ini - resolveStaticCredentials");
            return Promise.resolve({
                accessKeyId: profile.aws_access_key_id,
                secretAccessKey: profile.aws_secret_access_key,
                sessionToken: profile.aws_session_token,
                ...profile.aws_credential_scope && {
                    credentialScope: profile.aws_credential_scope
                },
                ...profile.aws_account_id && {
                    accountId: profile.aws_account_id
                }
            });
        };
        const isWebIdentityProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.web_identity_token_file && "string" == typeof arg.role_arn && [
                "undefined",
                "string"
            ].indexOf(typeof arg.role_session_name) > -1;
        const resolveWebIdentityCredentials = async (profile, options)=>__webpack_require__.e("488").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.649.0_@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js")).then(({ fromTokenFile })=>fromTokenFile({
                    webIdentityTokenFile: profile.web_identity_token_file,
                    roleArn: profile.role_arn,
                    roleSessionName: profile.role_session_name,
                    roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
                    logger: options.logger,
                    parentClientConfig: options.parentClientConfig
                })());
        const resolveProfileData = async (profileName, profiles, options, visitedProfiles = {}, isAssumeRoleRecursiveCall = false)=>{
            const data = profiles[profileName];
            if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isAssumeRoleRecursiveCall || isAssumeRoleProfile(data, {
                profile: profileName,
                logger: options.logger
            })) return resolveAssumeRoleCredentials(profileName, profiles, options, visitedProfiles);
            if (isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isWebIdentityProfile(data)) return resolveWebIdentityCredentials(data, options);
            if (isProcessProfile(data)) return resolveProcessCredentials(options, profileName);
            if (isSsoProfile(data)) return await resolveSsoCredentials(profileName, options);
            throw new property_provider_dist_es.C1(`Could not resolve credentials using profile: [${profileName}] in configuration/credentials file(s).`, {
                logger: options.logger
            });
        };
        const fromIni = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-ini - fromIni");
                const profiles = await (0, dist_es.YU)(init);
                return resolveProfileData((0, dist_es.Bz)(init), profiles, init);
            };
    }
};
