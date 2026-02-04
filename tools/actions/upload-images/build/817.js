"use strict";
exports.ids = [
    "817"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromSSO: ()=>fromSSO
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        var shared_ini_file_loader_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@2.4.0/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js");
        const isSsoProfile = (arg)=>arg && ("string" == typeof arg.sso_start_url || "string" == typeof arg.sso_account_id || "string" == typeof arg.sso_session || "string" == typeof arg.sso_region || "string" == typeof arg.sso_role_name);
        const REFRESH_MESSAGE = "To refresh this SSO session run 'aws sso login' with the corresponding profile.";
        const ssoOidcClientsHash = {};
        const getSsoOidcClient = async (ssoRegion)=>{
            const { SSOOIDCClient } = await __webpack_require__.e("437").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+token-providers@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/token-providers/dist-es/loadSsoOidc.js"));
            if (ssoOidcClientsHash[ssoRegion]) return ssoOidcClientsHash[ssoRegion];
            const ssoOidcClient = new SSOOIDCClient({
                region: ssoRegion
            });
            ssoOidcClientsHash[ssoRegion] = ssoOidcClient;
            return ssoOidcClient;
        };
        const getNewSsoOidcToken = async (ssoToken, ssoRegion)=>{
            const { CreateTokenCommand } = await __webpack_require__.e("437").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+token-providers@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/token-providers/dist-es/loadSsoOidc.js"));
            const ssoOidcClient = await getSsoOidcClient(ssoRegion);
            return ssoOidcClient.send(new CreateTokenCommand({
                clientId: ssoToken.clientId,
                clientSecret: ssoToken.clientSecret,
                refreshToken: ssoToken.refreshToken,
                grantType: "refresh_token"
            }));
        };
        const validateTokenExpiry = (token)=>{
            if (token.expiration && token.expiration.getTime() < Date.now()) throw new dist_es.Jh(`Token is expired. ${REFRESH_MESSAGE}`, false);
        };
        const validateTokenKey = (key, value, forRefresh = false)=>{
            if (void 0 === value) throw new dist_es.Jh(`Value not present for '${key}' in SSO Token${forRefresh ? ". Cannot refresh" : ""}. ${REFRESH_MESSAGE}`, false);
        };
        var external_fs_ = __webpack_require__("fs");
        const { writeFile } = external_fs_.promises;
        const writeSSOTokenToFile = (id, ssoToken)=>{
            const tokenFilepath = (0, shared_ini_file_loader_dist_es.C9)(id);
            const tokenString = JSON.stringify(ssoToken, null, 2);
            return writeFile(tokenFilepath, tokenString);
        };
        const lastRefreshAttemptTime = new Date(0);
        const fromSso = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/token-providers", "fromSso");
                const profiles = await (0, shared_ini_file_loader_dist_es.YU)(init);
                const profileName = (0, shared_ini_file_loader_dist_es.Bz)(init);
                const profile = profiles[profileName];
                if (profile) {
                    if (!profile["sso_session"]) throw new dist_es.Jh(`Profile '${profileName}' is missing required property 'sso_session'.`);
                } else throw new dist_es.Jh(`Profile '${profileName}' could not be found in shared credentials file.`, false);
                const ssoSessionName = profile["sso_session"];
                const ssoSessions = await (0, shared_ini_file_loader_dist_es.qw)(init);
                const ssoSession = ssoSessions[ssoSessionName];
                if (!ssoSession) throw new dist_es.Jh(`Sso session '${ssoSessionName}' could not be found in shared credentials file.`, false);
                for (const ssoSessionRequiredKey of [
                    "sso_start_url",
                    "sso_region"
                ])if (!ssoSession[ssoSessionRequiredKey]) throw new dist_es.Jh(`Sso session '${ssoSessionName}' is missing required property '${ssoSessionRequiredKey}'.`, false);
                ssoSession["sso_start_url"];
                const ssoRegion = ssoSession["sso_region"];
                let ssoToken;
                try {
                    ssoToken = await (0, shared_ini_file_loader_dist_es.vf)(ssoSessionName);
                } catch (e) {
                    throw new dist_es.Jh(`The SSO session token associated with profile=${profileName} was not found or is invalid. ${REFRESH_MESSAGE}`, false);
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
                    const newSsoOidcToken = await getNewSsoOidcToken(ssoToken, ssoRegion);
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
        const resolveSSOCredentials = async ({ ssoStartUrl, ssoSession, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, clientConfig, profile })=>{
            let token;
            const refreshMessage = "To refresh this SSO session run aws sso login with the corresponding profile.";
            if (ssoSession) try {
                const _token = await fromSso({
                    profile
                })();
                token = {
                    accessToken: _token.token,
                    expiresAt: new Date(_token.expiration).toISOString()
                };
            } catch (e) {
                throw new dist_es.C1(e.message, SHOULD_FAIL_CREDENTIAL_CHAIN);
            }
            else try {
                token = await (0, shared_ini_file_loader_dist_es.vf)(ssoStartUrl);
            } catch (e) {
                throw new dist_es.C1(`The SSO session associated with this profile is invalid. ${refreshMessage}`, SHOULD_FAIL_CREDENTIAL_CHAIN);
            }
            if (new Date(token.expiresAt).getTime() - Date.now() <= 0) throw new dist_es.C1(`The SSO session associated with this profile has expired. ${refreshMessage}`, SHOULD_FAIL_CREDENTIAL_CHAIN);
            const { accessToken } = token;
            const { SSOClient, GetRoleCredentialsCommand } = await __webpack_require__.e("318").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js"));
            const sso = ssoClient || new SSOClient(Object.assign({}, clientConfig ?? {}, {
                region: clientConfig?.region ?? ssoRegion
            }));
            let ssoResp;
            try {
                ssoResp = await sso.send(new GetRoleCredentialsCommand({
                    accountId: ssoAccountId,
                    roleName: ssoRoleName,
                    accessToken
                }));
            } catch (e) {
                throw dist_es.C1.from(e, SHOULD_FAIL_CREDENTIAL_CHAIN);
            }
            const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope } = {} } = ssoResp;
            if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) throw new dist_es.C1("SSO returns an invalid temporary credential.", SHOULD_FAIL_CREDENTIAL_CHAIN);
            return {
                accessKeyId,
                secretAccessKey,
                sessionToken,
                expiration: new Date(expiration),
                credentialScope
            };
        };
        const validateSsoProfile = (profile)=>{
            const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
            if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) throw new dist_es.C1(`Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", "sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(", ")}\nReference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`, false);
            return profile;
        };
        const fromSSO = (init = {})=>async ()=>{
                init.logger?.debug("@aws-sdk/credential-provider-sso", "fromSSO");
                const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
                const { ssoClient } = init;
                const profileName = (0, shared_ini_file_loader_dist_es.Bz)(init);
                if (ssoStartUrl || ssoAccountId || ssoRegion || ssoRoleName || ssoSession) if (ssoStartUrl && ssoAccountId && ssoRegion && ssoRoleName) return resolveSSOCredentials({
                    ssoStartUrl,
                    ssoSession,
                    ssoAccountId,
                    ssoRegion,
                    ssoRoleName,
                    ssoClient,
                    clientConfig: init.clientConfig,
                    profile: profileName
                });
                else throw new dist_es.C1('Incomplete configuration. The fromSSO() argument hash must include "ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"');
                {
                    const profiles = await (0, shared_ini_file_loader_dist_es.YU)(init);
                    const profile = profiles[profileName];
                    if (!profile) throw new dist_es.C1(`Profile ${profileName} was not found.`);
                    if (!isSsoProfile(profile)) throw new dist_es.C1(`Profile ${profileName} is not configured with SSO credentials.`);
                    if (profile?.sso_session) {
                        const ssoSessions = await (0, shared_ini_file_loader_dist_es.qw)(init);
                        const session = ssoSessions[profile.sso_session];
                        const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
                        if (ssoRegion && ssoRegion !== session.sso_region) throw new dist_es.C1("Conflicting SSO region" + conflictMsg, false);
                        if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) throw new dist_es.C1("Conflicting SSO start_url" + conflictMsg, false);
                        profile.sso_region = session.sso_region;
                        profile.sso_start_url = session.sso_start_url;
                    }
                    const { sso_start_url, sso_account_id, sso_region, sso_role_name, sso_session } = validateSsoProfile(profile);
                    return resolveSSOCredentials({
                        ssoStartUrl: sso_start_url,
                        ssoSession: sso_session,
                        ssoAccountId: sso_account_id,
                        ssoRegion: sso_region,
                        ssoRoleName: sso_role_name,
                        ssoClient: ssoClient,
                        clientConfig: init.clientConfig,
                        profile: profileName
                    });
                }
            };
    }
};
