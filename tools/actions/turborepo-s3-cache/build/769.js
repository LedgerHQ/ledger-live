"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ (function () {
  return typeof document === 'undefined'
    ? new (require('url'.replace('', '')).URL)('file:' + __filename).href
    : (document.currentScript && document.currentScript.src) ||
      new URL('main.js', document.baseURI).href;
})();
;
exports.ids = ["769"];
exports.modules = {
"../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  fromSSO: () => (/* reexport */ fromSSO)
});

// UNUSED EXPORTS: isSsoProfile, validateSsoProfile

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js + 6 modules
var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@3.1.5/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js + 14 modules
var shared_ini_file_loader_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@3.1.5/node_modules/@smithy/shared-ini-file-loader/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/isSsoProfile.js
const isSsoProfile = (arg) => arg &&
    (typeof arg.sso_start_url === "string" ||
        typeof arg.sso_account_id === "string" ||
        typeof arg.sso_session === "string" ||
        typeof arg.sso_region === "string" ||
        typeof arg.sso_role_name === "string");

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/constants.js
const EXPIRE_WINDOW_MS = 5 * 60 * 1000;
const REFRESH_MESSAGE = `To refresh this SSO session run 'aws sso login' with the corresponding profile.`;

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/getSsoOidcClient.js
const ssoOidcClientsHash = {};
const getSsoOidcClient = async (ssoRegion) => {
    const { SSOOIDCClient } = await __webpack_require__.e(/* import() */ "914").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sso-oidc/dist-es/index.js"));
    if (ssoOidcClientsHash[ssoRegion]) {
        return ssoOidcClientsHash[ssoRegion];
    }
    const ssoOidcClient = new SSOOIDCClient({ region: ssoRegion });
    ssoOidcClientsHash[ssoRegion] = ssoOidcClient;
    return ssoOidcClient;
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/getNewSsoOidcToken.js

const getNewSsoOidcToken = async (ssoToken, ssoRegion) => {
    const { CreateTokenCommand } = await __webpack_require__.e(/* import() */ "914").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sso-oidc/dist-es/index.js"));
    const ssoOidcClient = await getSsoOidcClient(ssoRegion);
    return ssoOidcClient.send(new CreateTokenCommand({
        clientId: ssoToken.clientId,
        clientSecret: ssoToken.clientSecret,
        refreshToken: ssoToken.refreshToken,
        grantType: "refresh_token",
    }));
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/validateTokenExpiry.js


const validateTokenExpiry = (token) => {
    if (token.expiration && token.expiration.getTime() < Date.now()) {
        throw new dist_es/* .TokenProviderError */.Jh(`Token is expired. ${REFRESH_MESSAGE}`, false);
    }
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/validateTokenKey.js


const validateTokenKey = (key, value, forRefresh = false) => {
    if (typeof value === "undefined") {
        throw new dist_es/* .TokenProviderError */.Jh(`Value not present for '${key}' in SSO Token${forRefresh ? ". Cannot refresh" : ""}. ${REFRESH_MESSAGE}`, false);
    }
};

// EXTERNAL MODULE: external "fs"
var external_fs_ = __webpack_require__("fs");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/writeSSOTokenToFile.js


const { writeFile } = external_fs_.promises;
const writeSSOTokenToFile = (id, ssoToken) => {
    const tokenFilepath = (0,shared_ini_file_loader_dist_es/* .getSSOTokenFilepath */.C9)(id);
    const tokenString = JSON.stringify(ssoToken, null, 2);
    return writeFile(tokenFilepath, tokenString);
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+token-providers@3.649.0_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/token-providers/dist-es/fromSso.js







const lastRefreshAttemptTime = new Date(0);
const fromSso = (init = {}) => async () => {
    init.logger?.debug("@aws-sdk/token-providers - fromSso");
    const profiles = await (0,shared_ini_file_loader_dist_es/* .parseKnownFiles */.YU)(init);
    const profileName = (0,shared_ini_file_loader_dist_es/* .getProfileName */.Bz)(init);
    const profile = profiles[profileName];
    if (!profile) {
        throw new dist_es/* .TokenProviderError */.Jh(`Profile '${profileName}' could not be found in shared credentials file.`, false);
    }
    else if (!profile["sso_session"]) {
        throw new dist_es/* .TokenProviderError */.Jh(`Profile '${profileName}' is missing required property 'sso_session'.`);
    }
    const ssoSessionName = profile["sso_session"];
    const ssoSessions = await (0,shared_ini_file_loader_dist_es/* .loadSsoSessionData */.qw)(init);
    const ssoSession = ssoSessions[ssoSessionName];
    if (!ssoSession) {
        throw new dist_es/* .TokenProviderError */.Jh(`Sso session '${ssoSessionName}' could not be found in shared credentials file.`, false);
    }
    for (const ssoSessionRequiredKey of ["sso_start_url", "sso_region"]) {
        if (!ssoSession[ssoSessionRequiredKey]) {
            throw new dist_es/* .TokenProviderError */.Jh(`Sso session '${ssoSessionName}' is missing required property '${ssoSessionRequiredKey}'.`, false);
        }
    }
    const ssoStartUrl = ssoSession["sso_start_url"];
    const ssoRegion = ssoSession["sso_region"];
    let ssoToken;
    try {
        ssoToken = await (0,shared_ini_file_loader_dist_es/* .getSSOTokenFromFile */.vf)(ssoSessionName);
    }
    catch (e) {
        throw new dist_es/* .TokenProviderError */.Jh(`The SSO session token associated with profile=${profileName} was not found or is invalid. ${REFRESH_MESSAGE}`, false);
    }
    validateTokenKey("accessToken", ssoToken.accessToken);
    validateTokenKey("expiresAt", ssoToken.expiresAt);
    const { accessToken, expiresAt } = ssoToken;
    const existingToken = { token: accessToken, expiration: new Date(expiresAt) };
    if (existingToken.expiration.getTime() - Date.now() > (/* inlined export .EXPIRE_WINDOW_MS */300000)) {
        return existingToken;
    }
    if (Date.now() - lastRefreshAttemptTime.getTime() < 30 * 1000) {
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
        const newTokenExpiration = new Date(Date.now() + newSsoOidcToken.expiresIn * 1000);
        try {
            await writeSSOTokenToFile(ssoSessionName, {
                ...ssoToken,
                accessToken: newSsoOidcToken.accessToken,
                expiresAt: newTokenExpiration.toISOString(),
                refreshToken: newSsoOidcToken.refreshToken,
            });
        }
        catch (error) {
        }
        return {
            token: newSsoOidcToken.accessToken,
            expiration: newTokenExpiration,
        };
    }
    catch (error) {
        validateTokenExpiry(existingToken);
        return existingToken;
    }
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/resolveSSOCredentials.js



const SHOULD_FAIL_CREDENTIAL_CHAIN = false;
const resolveSSOCredentials = async ({ ssoStartUrl, ssoSession, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, clientConfig, profile, logger, }) => {
    let token;
    const refreshMessage = `To refresh this SSO session run aws sso login with the corresponding profile.`;
    if (ssoSession) {
        try {
            const _token = await fromSso({ profile })();
            token = {
                accessToken: _token.token,
                expiresAt: new Date(_token.expiration).toISOString(),
            };
        }
        catch (e) {
            throw new dist_es/* .CredentialsProviderError */.C1(e.message, {
                tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                logger,
            });
        }
    }
    else {
        try {
            token = await (0,shared_ini_file_loader_dist_es/* .getSSOTokenFromFile */.vf)(ssoStartUrl);
        }
        catch (e) {
            throw new dist_es/* .CredentialsProviderError */.C1(`The SSO session associated with this profile is invalid. ${refreshMessage}`, {
                tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
                logger,
            });
        }
    }
    if (new Date(token.expiresAt).getTime() - Date.now() <= 0) {
        throw new dist_es/* .CredentialsProviderError */.C1(`The SSO session associated with this profile has expired. ${refreshMessage}`, {
            tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
            logger,
        });
    }
    const { accessToken } = token;
    const { SSOClient, GetRoleCredentialsCommand } = await __webpack_require__.e(/* import() */ "709").then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js"));
    const sso = ssoClient ||
        new SSOClient(Object.assign({}, clientConfig ?? {}, {
            region: clientConfig?.region ?? ssoRegion,
        }));
    let ssoResp;
    try {
        ssoResp = await sso.send(new GetRoleCredentialsCommand({
            accountId: ssoAccountId,
            roleName: ssoRoleName,
            accessToken,
        }));
    }
    catch (e) {
        throw new dist_es/* .CredentialsProviderError */.C1(e, {
            tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
            logger,
        });
    }
    const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope, accountId } = {}, } = ssoResp;
    if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
        throw new dist_es/* .CredentialsProviderError */.C1("SSO returns an invalid temporary credential.", {
            tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
            logger,
        });
    }
    return {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration: new Date(expiration),
        ...(credentialScope && { credentialScope }),
        ...(accountId && { accountId }),
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/validateSsoProfile.js

const validateSsoProfile = (profile, logger) => {
    const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
    if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) {
        throw new dist_es/* .CredentialsProviderError */.C1(`Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", ` +
            `"sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(", ")}\nReference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`, { tryNextLink: false, logger });
    }
    return profile;
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/fromSSO.js





const fromSSO = (init = {}) => async () => {
    init.logger?.debug("@aws-sdk/credential-provider-sso - fromSSO");
    const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
    const { ssoClient } = init;
    const profileName = (0,shared_ini_file_loader_dist_es/* .getProfileName */.Bz)(init);
    if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
        const profiles = await (0,shared_ini_file_loader_dist_es/* .parseKnownFiles */.YU)(init);
        const profile = profiles[profileName];
        if (!profile) {
            throw new dist_es/* .CredentialsProviderError */.C1(`Profile ${profileName} was not found.`, { logger: init.logger });
        }
        if (!isSsoProfile(profile)) {
            throw new dist_es/* .CredentialsProviderError */.C1(`Profile ${profileName} is not configured with SSO credentials.`, {
                logger: init.logger,
            });
        }
        if (profile?.sso_session) {
            const ssoSessions = await (0,shared_ini_file_loader_dist_es/* .loadSsoSessionData */.qw)(init);
            const session = ssoSessions[profile.sso_session];
            const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
            if (ssoRegion && ssoRegion !== session.sso_region) {
                throw new dist_es/* .CredentialsProviderError */.C1(`Conflicting SSO region` + conflictMsg, {
                    tryNextLink: false,
                    logger: init.logger,
                });
            }
            if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) {
                throw new dist_es/* .CredentialsProviderError */.C1(`Conflicting SSO start_url` + conflictMsg, {
                    tryNextLink: false,
                    logger: init.logger,
                });
            }
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
            profile: profileName,
        });
    }
    else if (!ssoStartUrl || !ssoAccountId || !ssoRegion || !ssoRoleName) {
        throw new dist_es/* .CredentialsProviderError */.C1("Incomplete configuration. The fromSSO() argument hash must include " +
            '"ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"', { tryNextLink: false, logger: init.logger });
    }
    else {
        return resolveSSOCredentials({
            ssoStartUrl,
            ssoSession,
            ssoAccountId,
            ssoRegion,
            ssoRoleName,
            ssoClient,
            clientConfig: init.clientConfig,
            profile: profileName,
        });
    }
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js






},

};
;