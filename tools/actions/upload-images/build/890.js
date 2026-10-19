"use strict";
exports.ids = [
    890
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromSSO: ()=>fromSSO
        });
        var CredentialsProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js");
        var getProfileName = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js");
        var parseKnownFiles = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js");
        var getConfigFilepath = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigFilepath.js");
        var dist_es_profile = __webpack_require__("../../../node_modules/.pnpm/@smithy+types@4.13.1/node_modules/@smithy/types/dist-es/profile.js");
        const getSsoSessionData = (data)=>Object.entries(data).filter(([key])=>key.startsWith(dist_es_profile.I.SSO_SESSION + ".")).reduce((acc, [key, value])=>({
                    ...acc,
                    [key.substring(key.indexOf(".") + 1)]: value
                }), {});
        var parseIni = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/parseIni.js");
        var readFile = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js");
        const swallowError = ()=>({});
        const loadSsoSessionData = async (init = {})=>(0, readFile.TA)(init.configFilepath ?? (0, getConfigFilepath.g)()).then(parseIni.A).then(getSsoSessionData).catch(swallowError);
        const isSsoProfile = (arg)=>arg && ("string" == typeof arg.sso_start_url || "string" == typeof arg.sso_account_id || "string" == typeof arg.sso_session || "string" == typeof arg.sso_region || "string" == typeof arg.sso_role_name);
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        var ProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/ProviderError.js");
        class TokenProviderError extends ProviderError.m {
            name = "TokenProviderError";
            constructor(message, options = true){
                super(message, options);
                Object.setPrototypeOf(this, TokenProviderError.prototype);
            }
        }
        var getSSOTokenFromFile = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFromFile.js");
        const REFRESH_MESSAGE = "To refresh this SSO session run 'aws sso login' with the corresponding profile.";
        const getSsoOidcClient = async (ssoRegion, init = {}, callerClientConfig)=>{
            const { SSOOIDCClient } = await Promise.all([
                __webpack_require__.e(971),
                __webpack_require__.e(549)
            ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sso-oidc/index.js"));
            const coalesce = (prop)=>init.clientConfig?.[prop] ?? init.parentClientConfig?.[prop] ?? callerClientConfig?.[prop];
            const ssoOidcClient = new SSOOIDCClient(Object.assign({}, init.clientConfig ?? {}, {
                region: ssoRegion ?? init.clientConfig?.region,
                logger: coalesce("logger"),
                userAgentAppId: coalesce("userAgentAppId")
            }));
            return ssoOidcClient;
        };
        const getNewSsoOidcToken = async (ssoToken, ssoRegion, init = {}, callerClientConfig)=>{
            const { CreateTokenCommand } = await Promise.all([
                __webpack_require__.e(971),
                __webpack_require__.e(549)
            ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sso-oidc/index.js"));
            const ssoOidcClient = await getSsoOidcClient(ssoRegion, init, callerClientConfig);
            return ssoOidcClient.send(new CreateTokenCommand({
                clientId: ssoToken.clientId,
                clientSecret: ssoToken.clientSecret,
                refreshToken: ssoToken.refreshToken,
                grantType: "refresh_token"
            }));
        };
        const validateTokenExpiry = (token)=>{
            if (token.expiration && token.expiration.getTime() < Date.now()) throw new TokenProviderError(`Token is expired. ${REFRESH_MESSAGE}`, false);
        };
        const validateTokenKey = (key, value, forRefresh = false)=>{
            if (void 0 === value) throw new TokenProviderError(`Value not present for '${key}' in SSO Token${forRefresh ? ". Cannot refresh" : ""}. ${REFRESH_MESSAGE}`, false);
        };
        var getSSOTokenFilepath = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js");
        var external_node_fs_ = __webpack_require__("node:fs");
        const { writeFile } = external_node_fs_.promises;
        const writeSSOTokenToFile = (id, ssoToken)=>{
            const tokenFilepath = (0, getSSOTokenFilepath.C)(id);
            const tokenString = JSON.stringify(ssoToken, null, 2);
            return writeFile(tokenFilepath, tokenString);
        };
        const lastRefreshAttemptTime = new Date(0);
        const fromSso = (init = {})=>async ({ callerClientConfig } = {})=>{
                init.logger?.debug("@aws-sdk/token-providers - fromSso");
                const profiles = await (0, parseKnownFiles.Y)(init);
                const profileName = (0, getProfileName.Bz)({
                    profile: init.profile ?? callerClientConfig?.profile
                });
                const profile = profiles[profileName];
                if (profile) {
                    if (!profile["sso_session"]) throw new TokenProviderError(`Profile '${profileName}' is missing required property 'sso_session'.`);
                } else throw new TokenProviderError(`Profile '${profileName}' could not be found in shared credentials file.`, false);
                const ssoSessionName = profile["sso_session"];
                const ssoSessions = await loadSsoSessionData(init);
                const ssoSession = ssoSessions[ssoSessionName];
                if (!ssoSession) throw new TokenProviderError(`Sso session '${ssoSessionName}' could not be found in shared credentials file.`, false);
                for (const ssoSessionRequiredKey of [
                    "sso_start_url",
                    "sso_region"
                ])if (!ssoSession[ssoSessionRequiredKey]) throw new TokenProviderError(`Sso session '${ssoSessionName}' is missing required property '${ssoSessionRequiredKey}'.`, false);
                ssoSession["sso_start_url"];
                const ssoRegion = ssoSession["sso_region"];
                let ssoToken;
                try {
                    ssoToken = await (0, getSSOTokenFromFile.v)(ssoSessionName);
                } catch (e) {
                    throw new TokenProviderError(`The SSO session token associated with profile=${profileName} was not found or is invalid. ${REFRESH_MESSAGE}`, false);
                }
                validateTokenKey("accessToken", ssoToken.accessToken);
                validateTokenKey("expiresAt", ssoToken.expiresAt);
                const { accessToken, expiresAt } = ssoToken;
                const existingToken = {
                    token: accessToken,
                    expiration: new Date(expiresAt)
                };
                if (existingToken.expiration.getTime() - Date.now() > 300000) return existingToken;
                if (Date.now() - lastRefreshAttemptTime.getTime() < 30000) {
                    validateTokenExpiry(existingToken);
                    return existingToken;
                }
                validateTokenKey("clientId", ssoToken.clientId, true);
                validateTokenKey("clientSecret", ssoToken.clientSecret, true);
                validateTokenKey("refreshToken", ssoToken.refreshToken, true);
                try {
                    lastRefreshAttemptTime.setTime(Date.now());
                    const newSsoOidcToken = await getNewSsoOidcToken(ssoToken, ssoRegion, init, callerClientConfig);
                    validateTokenKey("accessToken", newSsoOidcToken.accessToken);
                    validateTokenKey("expiresIn", newSsoOidcToken.expiresIn);
                    const newTokenExpiration = new Date(Date.now() + 1000 * newSsoOidcToken.expiresIn);
                    try {
                        await writeSSOTokenToFile(ssoSessionName, {
                            ...ssoToken,
                            accessToken: newSsoOidcToken.accessToken,
                            expiresAt: newTokenExpiration.toISOString(),
                            refreshToken: newSsoOidcToken.refreshToken
                        });
                    } catch (error) {}
                    return {
                        token: newSsoOidcToken.accessToken,
                        expiration: newTokenExpiration
                    };
                } catch (error) {
                    validateTokenExpiry(existingToken);
                    return existingToken;
                }
            };
        const SHOULD_FAIL_CREDENTIAL_CHAIN = false;
        const resolveSSOCredentials = async ({ ssoStartUrl, ssoSession, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, clientConfig, parentClientConfig, callerClientConfig, profile, filepath, configFilepath, ignoreCache, logger })=>{
            let token;
            const refreshMessage = "To refresh this SSO session run aws sso login with the corresponding profile.";
            if (ssoSession) try {
                const _token = await fromSso({
                    profile,
                    filepath,
                    configFilepath,
                    ignoreCache
                })();
                token = {
                    accessToken: _token.token,
                    expiresAt: new Date(_token.expiration).toISOString()
                };
            } catch (e) {
                throw new CredentialsProviderError.C(e.message, {
                    tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                    logger
                });
            }
            else try {
                token = await (0, getSSOTokenFromFile.v)(ssoStartUrl);
            } catch (e) {
                throw new CredentialsProviderError.C(`The SSO session associated with this profile is invalid. ${refreshMessage}`, {
                    tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                    logger
                });
            }
            if (new Date(token.expiresAt).getTime() - Date.now() <= 0) throw new CredentialsProviderError.C(`The SSO session associated with this profile has expired. ${refreshMessage}`, {
                tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                logger
            });
            const { accessToken } = token;
            const { SSOClient, GetRoleCredentialsCommand } = await Promise.all([
                __webpack_require__.e(971),
                __webpack_require__.e(664)
            ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js"));
            const sso = ssoClient || new SSOClient(Object.assign({}, clientConfig ?? {}, {
                logger: clientConfig?.logger ?? callerClientConfig?.logger ?? parentClientConfig?.logger,
                region: clientConfig?.region ?? ssoRegion,
                userAgentAppId: clientConfig?.userAgentAppId ?? callerClientConfig?.userAgentAppId ?? parentClientConfig?.userAgentAppId
            }));
            let ssoResp;
            try {
                ssoResp = await sso.send(new GetRoleCredentialsCommand({
                    accountId: ssoAccountId,
                    roleName: ssoRoleName,
                    accessToken
                }));
            } catch (e) {
                throw new CredentialsProviderError.C(e, {
                    tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                    logger
                });
            }
            const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope, accountId } = {} } = ssoResp;
            if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) throw new CredentialsProviderError.C("SSO returns an invalid temporary credential.", {
                tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                logger
            });
            const credentials = {
                accessKeyId,
                secretAccessKey,
                sessionToken,
                expiration: new Date(expiration),
                ...credentialScope && {
                    credentialScope
                },
                ...accountId && {
                    accountId
                }
            };
            if (ssoSession) (0, setCredentialFeature.g)(credentials, "CREDENTIALS_SSO", "s");
            else (0, setCredentialFeature.g)(credentials, "CREDENTIALS_SSO_LEGACY", "u");
            return credentials;
        };
        const validateSsoProfile = (profile, logger)=>{
            const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
            if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) throw new CredentialsProviderError.C(`Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", "sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(", ")}\nReference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`, {
                tryNextLink: false,
                logger
            });
            return profile;
        };
        const fromSSO = (init = {})=>async ({ callerClientConfig } = {})=>{
                init.logger?.debug("@aws-sdk/credential-provider-sso - fromSSO");
                const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
                const { ssoClient } = init;
                const profileName = (0, getProfileName.Bz)({
                    profile: init.profile ?? callerClientConfig?.profile
                });
                if (ssoStartUrl || ssoAccountId || ssoRegion || ssoRoleName || ssoSession) if (ssoStartUrl && ssoAccountId && ssoRegion && ssoRoleName) return resolveSSOCredentials({
                    ssoStartUrl,
                    ssoSession,
                    ssoAccountId,
                    ssoRegion,
                    ssoRoleName,
                    ssoClient,
                    clientConfig: init.clientConfig,
                    parentClientConfig: init.parentClientConfig,
                    callerClientConfig: init.callerClientConfig,
                    profile: profileName,
                    filepath: init.filepath,
                    configFilepath: init.configFilepath,
                    ignoreCache: init.ignoreCache,
                    logger: init.logger
                });
                else throw new CredentialsProviderError.C('Incomplete configuration. The fromSSO() argument hash must include "ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"', {
                    tryNextLink: false,
                    logger: init.logger
                });
                {
                    const profiles = await (0, parseKnownFiles.Y)(init);
                    const profile = profiles[profileName];
                    if (!profile) throw new CredentialsProviderError.C(`Profile ${profileName} was not found.`, {
                        logger: init.logger
                    });
                    if (!isSsoProfile(profile)) throw new CredentialsProviderError.C(`Profile ${profileName} is not configured with SSO credentials.`, {
                        logger: init.logger
                    });
                    if (profile?.sso_session) {
                        const ssoSessions = await loadSsoSessionData(init);
                        const session = ssoSessions[profile.sso_session];
                        const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
                        if (ssoRegion && ssoRegion !== session.sso_region) throw new CredentialsProviderError.C("Conflicting SSO region" + conflictMsg, {
                            tryNextLink: false,
                            logger: init.logger
                        });
                        if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) throw new CredentialsProviderError.C("Conflicting SSO start_url" + conflictMsg, {
                            tryNextLink: false,
                            logger: init.logger
                        });
                        profile.sso_region = session.sso_region;
                        profile.sso_start_url = session.sso_start_url;
                    }
                    const { sso_start_url, sso_account_id, sso_region, sso_role_name, sso_session } = validateSsoProfile(profile, init.logger);
                    return resolveSSOCredentials({
                        ssoStartUrl: sso_start_url,
                        ssoSession: sso_session,
                        ssoAccountId: sso_account_id,
                        ssoRegion: sso_region,
                        ssoRoleName: sso_role_name,
                        ssoClient: ssoClient,
                        clientConfig: init.clientConfig,
                        parentClientConfig: init.parentClientConfig,
                        callerClientConfig: init.callerClientConfig,
                        profile: profileName,
                        filepath: init.filepath,
                        configFilepath: init.configFilepath,
                        ignoreCache: init.ignoreCache,
                        logger: init.logger
                    });
                }
            };
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
    },
    "../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Y: ()=>parseKnownFiles
        });
        var loadSharedConfigFiles = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSharedConfigFiles.js");
        const mergeConfigFiles = (...files)=>{
            const merged = {};
            for (const file of files)for (const [key, values] of Object.entries(file))if (void 0 !== merged[key]) Object.assign(merged[key], values);
            else merged[key] = values;
            return merged;
        };
        const parseKnownFiles = async (init)=>{
            const parsedFiles = await (0, loadSharedConfigFiles.p)(init);
            return mergeConfigFiles(parsedFiles.configFile, parsedFiles.credentialsFile);
        };
    }
};
