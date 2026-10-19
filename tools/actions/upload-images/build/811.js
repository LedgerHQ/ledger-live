"use strict";
exports.ids = [
    811
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-ini@3.972.27/node_modules/@aws-sdk/credential-provider-ini/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromIni: ()=>fromIni
        });
        var parseKnownFiles = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js");
        var getProfileName = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js");
        var CredentialsProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js");
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        var chain = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/chain.js");
        const resolveCredentialSource = (credentialSource, profileName, logger)=>{
            const sourceProvidersMap = {
                EcsContainer: async (options)=>{
                    const { fromHttp } = await __webpack_require__.e(439).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-http@3.972.26/node_modules/@aws-sdk/credential-provider-http/dist-es/index.js"));
                    const { fromContainerMetadata } = await __webpack_require__.e(14).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@4.2.12/node_modules/@smithy/credential-provider-imds/dist-es/index.js"));
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is EcsContainer");
                    return async ()=>(0, chain.c)(fromHttp(options ?? {}), fromContainerMetadata(options))().then(setNamedProvider);
                },
                Ec2InstanceMetadata: async (options)=>{
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is Ec2InstanceMetadata");
                    const { fromInstanceMetadata } = await __webpack_require__.e(14).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@smithy+credential-provider-imds@4.2.12/node_modules/@smithy/credential-provider-imds/dist-es/index.js"));
                    return async ()=>fromInstanceMetadata(options)().then(setNamedProvider);
                },
                Environment: async (options)=>{
                    logger?.debug("@aws-sdk/credential-provider-ini - credential_source is Environment");
                    const { fromEnv } = await __webpack_require__.e(355).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-env@3.972.24/node_modules/@aws-sdk/credential-provider-env/dist-es/index.js"));
                    return async ()=>fromEnv(options)().then(setNamedProvider);
                }
            };
            if (credentialSource in sourceProvidersMap) return sourceProvidersMap[credentialSource];
            throw new CredentialsProviderError.C(`Unsupported credential source in profile ${profileName}. Got ${credentialSource}, expected EcsContainer or Ec2InstanceMetadata or Environment.`, {
                logger
            });
        };
        const setNamedProvider = (creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_NAMED_PROVIDER", "p");
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
        const resolveAssumeRoleCredentials = async (profileName, profiles, options, callerClientConfig, visitedProfiles = {}, resolveProfileData)=>{
            options.logger?.debug("@aws-sdk/credential-provider-ini - resolveAssumeRoleCredentials (STS)");
            const profileData = profiles[profileName];
            const { source_profile, region } = profileData;
            if (!options.roleAssumer) {
                const { getDefaultRoleAssumer } = await __webpack_require__.e(849).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sts/index.js"));
                options.roleAssumer = getDefaultRoleAssumer({
                    ...options.clientConfig,
                    credentialProviderLogger: options.logger,
                    parentClientConfig: {
                        ...callerClientConfig,
                        ...options?.parentClientConfig,
                        region: region ?? options?.parentClientConfig?.region ?? callerClientConfig?.region
                    }
                }, options.clientPlugins);
            }
            if (source_profile && source_profile in visitedProfiles) throw new CredentialsProviderError.C(`Detected a cycle attempting to resolve credentials for profile ${(0, getProfileName.Bz)(options)}. Profiles visited: ` + Object.keys(visitedProfiles).join(", "), {
                logger: options.logger
            });
            options.logger?.debug(`@aws-sdk/credential-provider-ini - finding credential resolver using ${source_profile ? `source_profile=[${source_profile}]` : `profile=[${profileName}]`}`);
            const sourceCredsProvider = source_profile ? resolveProfileData(source_profile, profiles, options, callerClientConfig, {
                ...visitedProfiles,
                [source_profile]: true
            }, isCredentialSourceWithoutRoleArn(profiles[source_profile] ?? {})) : (await resolveCredentialSource(profileData.credential_source, profileName, options.logger)(options))();
            if (isCredentialSourceWithoutRoleArn(profileData)) return sourceCredsProvider.then((creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_SOURCE_PROFILE", "o"));
            {
                const params = {
                    RoleArn: profileData.role_arn,
                    RoleSessionName: profileData.role_session_name || `aws-sdk-js-${Date.now()}`,
                    ExternalId: profileData.external_id,
                    DurationSeconds: parseInt(profileData.duration_seconds || "3600", 10)
                };
                const { mfa_serial } = profileData;
                if (mfa_serial) {
                    if (!options.mfaCodeProvider) throw new CredentialsProviderError.C(`Profile ${profileName} requires multi-factor authentication, but no MFA code callback was provided.`, {
                        logger: options.logger,
                        tryNextLink: false
                    });
                    params.SerialNumber = mfa_serial;
                    params.TokenCode = await options.mfaCodeProvider(mfa_serial);
                }
                const sourceCreds = await sourceCredsProvider;
                return options.roleAssumer(sourceCreds, params).then((creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_SOURCE_PROFILE", "o"));
            }
        };
        const isCredentialSourceWithoutRoleArn = (section)=>!section.role_arn && !!section.credential_source;
        var httpRequest = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@5.3.12/node_modules/@smithy/protocol-http/dist-es/httpRequest.js");
        var readFile = __webpack_require__("../../../node_modules/.pnpm/@smithy+shared-ini-file-loader@4.4.7/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js");
        var external_node_crypto_ = __webpack_require__("node:crypto");
        var external_node_fs_ = __webpack_require__("node:fs");
        var external_node_os_ = __webpack_require__("node:os");
        var external_node_path_ = __webpack_require__("node:path");
        class LoginCredentialsFetcher {
            profileData;
            init;
            callerClientConfig;
            static REFRESH_THRESHOLD = 300000;
            constructor(profileData, init, callerClientConfig){
                this.profileData = profileData;
                this.init = init;
                this.callerClientConfig = callerClientConfig;
            }
            async loadCredentials() {
                const token = await this.loadToken();
                if (!token) throw new CredentialsProviderError.C(`Failed to load a token for session ${this.loginSession}, please re-authenticate using aws login`, {
                    tryNextLink: false,
                    logger: this.logger
                });
                const accessToken = token.accessToken;
                const now = Date.now();
                const expiryTime = new Date(accessToken.expiresAt).getTime();
                const timeUntilExpiry = expiryTime - now;
                if (timeUntilExpiry <= LoginCredentialsFetcher.REFRESH_THRESHOLD) return this.refresh(token);
                return {
                    accessKeyId: accessToken.accessKeyId,
                    secretAccessKey: accessToken.secretAccessKey,
                    sessionToken: accessToken.sessionToken,
                    accountId: accessToken.accountId,
                    expiration: new Date(accessToken.expiresAt)
                };
            }
            get logger() {
                return this.init?.logger;
            }
            get loginSession() {
                return this.profileData.login_session;
            }
            async refresh(token) {
                const { SigninClient, CreateOAuth2TokenCommand } = await Promise.all([
                    __webpack_require__.e(971),
                    __webpack_require__.e(834)
                ]).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/signin/index.js"));
                const { logger, userAgentAppId } = this.callerClientConfig ?? {};
                const isH2 = (requestHandler)=>requestHandler?.metadata?.handlerProtocol === "h2";
                const requestHandler = isH2(this.callerClientConfig?.requestHandler) ? void 0 : this.callerClientConfig?.requestHandler;
                const region = this.profileData.region ?? await this.callerClientConfig?.region?.() ?? process.env.AWS_REGION;
                const client = new SigninClient({
                    credentials: {
                        accessKeyId: "",
                        secretAccessKey: ""
                    },
                    region,
                    requestHandler,
                    logger,
                    userAgentAppId,
                    ...this.init?.clientConfig
                });
                this.createDPoPInterceptor(client.middlewareStack);
                const commandInput = {
                    tokenInput: {
                        clientId: token.clientId,
                        refreshToken: token.refreshToken,
                        grantType: "refresh_token"
                    }
                };
                try {
                    const response = await client.send(new CreateOAuth2TokenCommand(commandInput));
                    const { accessKeyId, secretAccessKey, sessionToken } = response.tokenOutput?.accessToken ?? {};
                    const { refreshToken, expiresIn } = response.tokenOutput ?? {};
                    if (!accessKeyId || !secretAccessKey || !sessionToken || !refreshToken) throw new CredentialsProviderError.C("Token refresh response missing required fields", {
                        logger: this.logger,
                        tryNextLink: false
                    });
                    const expiresInMs = (expiresIn ?? 900) * 1000;
                    const expiration = new Date(Date.now() + expiresInMs);
                    const updatedToken = {
                        ...token,
                        accessToken: {
                            ...token.accessToken,
                            accessKeyId: accessKeyId,
                            secretAccessKey: secretAccessKey,
                            sessionToken: sessionToken,
                            expiresAt: expiration.toISOString()
                        },
                        refreshToken: refreshToken
                    };
                    await this.saveToken(updatedToken);
                    const newAccessToken = updatedToken.accessToken;
                    return {
                        accessKeyId: newAccessToken.accessKeyId,
                        secretAccessKey: newAccessToken.secretAccessKey,
                        sessionToken: newAccessToken.sessionToken,
                        accountId: newAccessToken.accountId,
                        expiration
                    };
                } catch (error) {
                    if ("AccessDeniedException" === error.name) {
                        const errorType = error.error;
                        let message;
                        switch(errorType){
                            case "TOKEN_EXPIRED":
                                message = "Your session has expired. Please reauthenticate.";
                                break;
                            case "USER_CREDENTIALS_CHANGED":
                                message = "Unable to refresh credentials because of a change in your password. Please reauthenticate with your new password.";
                                break;
                            case "INSUFFICIENT_PERMISSIONS":
                                message = "Unable to refresh credentials due to insufficient permissions. You may be missing permission for the 'CreateOAuth2Token' action.";
                                break;
                            default:
                                message = `Failed to refresh token: ${String(error)}. Please re-authenticate using \`aws login\``;
                        }
                        throw new CredentialsProviderError.C(message, {
                            logger: this.logger,
                            tryNextLink: false
                        });
                    }
                    throw new CredentialsProviderError.C(`Failed to refresh token: ${String(error)}. Please re-authenticate using aws login`, {
                        logger: this.logger
                    });
                }
            }
            async loadToken() {
                const tokenFilePath = this.getTokenFilePath();
                try {
                    let tokenData;
                    try {
                        tokenData = await (0, readFile.TA)(tokenFilePath, {
                            ignoreCache: this.init?.ignoreCache
                        });
                    } catch  {
                        tokenData = await external_node_fs_.promises.readFile(tokenFilePath, "utf8");
                    }
                    const token = JSON.parse(tokenData);
                    const missingFields = [
                        "accessToken",
                        "clientId",
                        "refreshToken",
                        "dpopKey"
                    ].filter((k)=>!token[k]);
                    if (!token.accessToken?.accountId) missingFields.push("accountId");
                    if (missingFields.length > 0) throw new CredentialsProviderError.C(`Token validation failed, missing fields: ${missingFields.join(", ")}`, {
                        logger: this.logger,
                        tryNextLink: false
                    });
                    return token;
                } catch (error) {
                    throw new CredentialsProviderError.C(`Failed to load token from ${tokenFilePath}: ${String(error)}`, {
                        logger: this.logger,
                        tryNextLink: false
                    });
                }
            }
            async saveToken(token) {
                const tokenFilePath = this.getTokenFilePath();
                const directory = (0, external_node_path_.dirname)(tokenFilePath);
                try {
                    await external_node_fs_.promises.mkdir(directory, {
                        recursive: true
                    });
                } catch (error) {}
                await external_node_fs_.promises.writeFile(tokenFilePath, JSON.stringify(token, null, 2), "utf8");
            }
            getTokenFilePath() {
                const directory = process.env.AWS_LOGIN_CACHE_DIRECTORY ?? (0, external_node_path_.join)((0, external_node_os_.homedir)(), ".aws", "login", "cache");
                const loginSessionBytes = Buffer.from(this.loginSession, "utf8");
                const loginSessionSha256 = (0, external_node_crypto_.createHash)("sha256").update(loginSessionBytes).digest("hex");
                return (0, external_node_path_.join)(directory, `${loginSessionSha256}.json`);
            }
            derToRawSignature(derSignature) {
                let offset = 2;
                if (0x02 !== derSignature[offset]) throw new Error("Invalid DER signature");
                offset++;
                const rLength = derSignature[offset++];
                let r = derSignature.subarray(offset, offset + rLength);
                offset += rLength;
                if (0x02 !== derSignature[offset]) throw new Error("Invalid DER signature");
                offset++;
                const sLength = derSignature[offset++];
                let s = derSignature.subarray(offset, offset + sLength);
                r = 0x00 === r[0] ? r.subarray(1) : r;
                s = 0x00 === s[0] ? s.subarray(1) : s;
                const rPadded = Buffer.concat([
                    Buffer.alloc(32 - r.length),
                    r
                ]);
                const sPadded = Buffer.concat([
                    Buffer.alloc(32 - s.length),
                    s
                ]);
                return Buffer.concat([
                    rPadded,
                    sPadded
                ]);
            }
            createDPoPInterceptor(middlewareStack) {
                middlewareStack.add((next)=>async (args)=>{
                        if (httpRequest.K.isInstance(args.request)) {
                            const request = args.request;
                            const actualEndpoint = `${request.protocol}//${request.hostname}${request.port ? `:${request.port}` : ""}${request.path}`;
                            const dpop = await this.generateDpop(request.method, actualEndpoint);
                            request.headers = {
                                ...request.headers,
                                DPoP: dpop
                            };
                        }
                        return next(args);
                    }, {
                    step: "finalizeRequest",
                    name: "dpopInterceptor",
                    override: true
                });
            }
            async generateDpop(method = "POST", endpoint) {
                const token = await this.loadToken();
                try {
                    const privateKey = (0, external_node_crypto_.createPrivateKey)({
                        key: token.dpopKey,
                        format: "pem",
                        type: "sec1"
                    });
                    const publicKey = (0, external_node_crypto_.createPublicKey)(privateKey);
                    const publicDer = publicKey.export({
                        format: "der",
                        type: "spki"
                    });
                    let pointStart = -1;
                    for(let i = 0; i < publicDer.length; i++)if (0x04 === publicDer[i]) {
                        pointStart = i;
                        break;
                    }
                    const x = publicDer.slice(pointStart + 1, pointStart + 33);
                    const y = publicDer.slice(pointStart + 33, pointStart + 65);
                    const header = {
                        alg: "ES256",
                        typ: "dpop+jwt",
                        jwk: {
                            kty: "EC",
                            crv: "P-256",
                            x: x.toString("base64url"),
                            y: y.toString("base64url")
                        }
                    };
                    const payload = {
                        jti: crypto.randomUUID(),
                        htm: method,
                        htu: endpoint,
                        iat: Math.floor(Date.now() / 1000)
                    };
                    const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
                    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
                    const message = `${headerB64}.${payloadB64}`;
                    const asn1Signature = (0, external_node_crypto_.sign)("sha256", Buffer.from(message), privateKey);
                    const rawSignature = this.derToRawSignature(asn1Signature);
                    const signatureB64 = rawSignature.toString("base64url");
                    return `${message}.${signatureB64}`;
                } catch (error) {
                    throw new CredentialsProviderError.C(`Failed to generate Dpop proof: ${error instanceof Error ? error.message : String(error)}`, {
                        logger: this.logger,
                        tryNextLink: false
                    });
                }
            }
        }
        const fromLoginCredentials = (init)=>async ({ callerClientConfig } = {})=>{
                init?.logger?.debug?.("@aws-sdk/credential-providers - fromLoginCredentials");
                const profiles = await (0, parseKnownFiles.Y)(init || {});
                const profileName = (0, getProfileName.Bz)({
                    profile: init?.profile ?? callerClientConfig?.profile
                });
                const profile = profiles[profileName];
                if (!profile?.login_session) throw new CredentialsProviderError.C(`Profile ${profileName} does not contain login_session.`, {
                    tryNextLink: true,
                    logger: init?.logger
                });
                const fetcher = new LoginCredentialsFetcher(profile, init, callerClientConfig);
                const credentials = await fetcher.loadCredentials();
                return (0, setCredentialFeature.g)(credentials, "CREDENTIALS_LOGIN", "AD");
            };
        const isLoginProfile = (data)=>Boolean(data && data.login_session);
        const resolveLoginCredentials = async (profileName, options, callerClientConfig)=>{
            const credentials = await fromLoginCredentials({
                ...options,
                profile: profileName
            })({
                callerClientConfig
            });
            return (0, setCredentialFeature.g)(credentials, "CREDENTIALS_PROFILE_LOGIN", "AC");
        };
        const isProcessProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.credential_process;
        const resolveProcessCredentials = async (options, profile)=>__webpack_require__.e(352).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-process@3.972.24/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js")).then(({ fromProcess })=>fromProcess({
                    ...options,
                    profile
                })().then((creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_PROCESS", "v")));
        const resolveSsoCredentials = async (profile, profileData, options = {}, callerClientConfig)=>{
            const { fromSSO } = await __webpack_require__.e(509).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js"));
            return fromSSO({
                profile,
                logger: options.logger,
                parentClientConfig: options.parentClientConfig,
                clientConfig: options.clientConfig
            })({
                callerClientConfig
            }).then((creds)=>{
                if (profileData.sso_session) return (0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_SSO", "r");
                return (0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_SSO_LEGACY", "t");
            });
        };
        const isSsoProfile = (arg)=>arg && ("string" == typeof arg.sso_start_url || "string" == typeof arg.sso_account_id || "string" == typeof arg.sso_session || "string" == typeof arg.sso_region || "string" == typeof arg.sso_role_name);
        const isStaticCredsProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.aws_access_key_id && "string" == typeof arg.aws_secret_access_key && [
                "undefined",
                "string"
            ].indexOf(typeof arg.aws_session_token) > -1 && [
                "undefined",
                "string"
            ].indexOf(typeof arg.aws_account_id) > -1;
        const resolveStaticCredentials = async (profile, options)=>{
            options?.logger?.debug("@aws-sdk/credential-provider-ini - resolveStaticCredentials");
            const credentials = {
                accessKeyId: profile.aws_access_key_id,
                secretAccessKey: profile.aws_secret_access_key,
                sessionToken: profile.aws_session_token,
                ...profile.aws_credential_scope && {
                    credentialScope: profile.aws_credential_scope
                },
                ...profile.aws_account_id && {
                    accountId: profile.aws_account_id
                }
            };
            return (0, setCredentialFeature.g)(credentials, "CREDENTIALS_PROFILE", "n");
        };
        const isWebIdentityProfile = (arg)=>Boolean(arg) && "object" == typeof arg && "string" == typeof arg.web_identity_token_file && "string" == typeof arg.role_arn && [
                "undefined",
                "string"
            ].indexOf(typeof arg.role_session_name) > -1;
        const resolveWebIdentityCredentials = async (profile, options, callerClientConfig)=>__webpack_require__.e(335).then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-web-identity@3.972.27/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js")).then(({ fromTokenFile })=>fromTokenFile({
                    webIdentityTokenFile: profile.web_identity_token_file,
                    roleArn: profile.role_arn,
                    roleSessionName: profile.role_session_name,
                    roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
                    logger: options.logger,
                    parentClientConfig: options.parentClientConfig
                })({
                    callerClientConfig
                }).then((creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_PROFILE_STS_WEB_ID_TOKEN", "q")));
        const resolveProfileData_resolveProfileData = async (profileName, profiles, options, callerClientConfig, visitedProfiles = {}, isAssumeRoleRecursiveCall = false)=>{
            const data = profiles[profileName];
            if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isAssumeRoleRecursiveCall || isAssumeRoleProfile(data, {
                profile: profileName,
                logger: options.logger
            })) return resolveAssumeRoleCredentials(profileName, profiles, options, callerClientConfig, visitedProfiles, resolveProfileData_resolveProfileData);
            if (isStaticCredsProfile(data)) return resolveStaticCredentials(data, options);
            if (isWebIdentityProfile(data)) return resolveWebIdentityCredentials(data, options, callerClientConfig);
            if (isProcessProfile(data)) return resolveProcessCredentials(options, profileName);
            if (isSsoProfile(data)) return await resolveSsoCredentials(profileName, data, options, callerClientConfig);
            if (isLoginProfile(data)) return resolveLoginCredentials(profileName, options, callerClientConfig);
            throw new CredentialsProviderError.C(`Could not resolve credentials using profile: [${profileName}] in configuration/credentials file(s).`, {
                logger: options.logger
            });
        };
        const fromIni = (init = {})=>async ({ callerClientConfig } = {})=>{
                init.logger?.debug("@aws-sdk/credential-provider-ini - fromIni");
                const profiles = await (0, parseKnownFiles.Y)(init);
                return resolveProfileData_resolveProfileData((0, getProfileName.Bz)({
                    profile: init.profile ?? callerClientConfig?.profile
                }), profiles, init, callerClientConfig);
            };
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
