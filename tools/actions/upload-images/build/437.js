"use strict";
exports.ids = [
    "437"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            f: ()=>AwsSdkSigV4Signer
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@3.3.0/node_modules/@smithy/protocol-http/dist-es/index.js");
        const getSkewCorrectedDate = (systemClockOffset)=>new Date(Date.now() + systemClockOffset);
        const getDateHeader = (response)=>dist_es.cS.isInstance(response) ? response.headers?.date ?? response.headers?.Date : void 0;
        const isClockSkewed = (clockTime, systemClockOffset)=>Math.abs(getSkewCorrectedDate(systemClockOffset).getTime() - clockTime) >= 300000;
        const getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset)=>{
            const clockTimeInMs = Date.parse(clockTime);
            if (isClockSkewed(clockTimeInMs, currentSystemClockOffset)) return clockTimeInMs - Date.now();
            return currentSystemClockOffset;
        };
        const throwSigningPropertyError = (name, property)=>{
            if (!property) throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
            return property;
        };
        const validateSigningProperties = async (signingProperties)=>{
            const context = throwSigningPropertyError("context", signingProperties.context);
            const config = throwSigningPropertyError("config", signingProperties.config);
            const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
            const signerFunction = throwSigningPropertyError("signer", config.signer);
            const signer = await signerFunction(authScheme);
            const signingRegion = signingProperties?.signingRegion;
            const signingName = signingProperties?.signingName;
            return {
                config,
                signer,
                signingRegion,
                signingName
            };
        };
        class AwsSdkSigV4Signer {
            async sign(httpRequest, identity, signingProperties) {
                if (!dist_es.Kd.isInstance(httpRequest)) throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
                const { config, signer, signingRegion, signingName } = await validateSigningProperties(signingProperties);
                const signedRequest = await signer.sign(httpRequest, {
                    signingDate: getSkewCorrectedDate(config.systemClockOffset),
                    signingRegion: signingRegion,
                    signingService: signingName
                });
                return signedRequest;
            }
            errorHandler(signingProperties) {
                return (error)=>{
                    const serverTime = error.ServerTime ?? getDateHeader(error.$response);
                    if (serverTime) {
                        const config = throwSigningPropertyError("config", signingProperties.config);
                        const initialSystemClockOffset = config.systemClockOffset;
                        config.systemClockOffset = getUpdatedSystemClockOffset(serverTime, config.systemClockOffset);
                        const clockSkewCorrected = config.systemClockOffset !== initialSystemClockOffset;
                        if (clockSkewCorrected && error.$metadata) error.$metadata.clockSkewCorrected = true;
                    }
                    throw error;
                };
            }
            successHandler(httpResponse, signingProperties) {
                const dateHeader = getDateHeader(httpResponse);
                if (dateHeader) {
                    const config = throwSigningPropertyError("config", signingProperties.config);
                    config.systemClockOffset = getUpdatedSystemClockOffset(dateHeader, config.systemClockOffset);
                }
            }
        }
    },
    "../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            h: ()=>resolveAwsSdkSigV4Config
        });
        var _smithy_core__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@1.4.0/node_modules/@smithy/core/dist-es/index.js");
        var _smithy_signature_v4__rspack_import_1 = __webpack_require__("../../../node_modules/.pnpm/@smithy+signature-v4@2.2.0/node_modules/@smithy/signature-v4/dist-es/index.js");
        const resolveAwsSdkSigV4Config = (config)=>{
            let normalizedCreds;
            if (config.credentials) normalizedCreds = (0, _smithy_core__rspack_import_0.K4)(config.credentials, _smithy_core__rspack_import_0.OC, _smithy_core__rspack_import_0.e);
            if (!normalizedCreds) normalizedCreds = config.credentialDefaultProvider ? (0, _smithy_core__rspack_import_0.te)(config.credentialDefaultProvider(Object.assign({}, config, {
                parentClientConfig: config
            }))) : async ()=>{
                throw new Error("`credentials` is missing");
            };
            const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
            let signer;
            signer = config.signer ? (0, _smithy_core__rspack_import_0.te)(config.signer) : config.regionInfoProvider ? ()=>(0, _smithy_core__rspack_import_0.te)(config.region)().then(async (region)=>[
                        await config.regionInfoProvider(region, {
                            useFipsEndpoint: await config.useFipsEndpoint(),
                            useDualstackEndpoint: await config.useDualstackEndpoint()
                        }) || {},
                        region
                    ]).then(([regionInfo, region])=>{
                    const { signingRegion, signingService } = regionInfo;
                    config.signingRegion = config.signingRegion || signingRegion || region;
                    config.signingName = config.signingName || signingService || config.serviceId;
                    const params = {
                        ...config,
                        credentials: normalizedCreds,
                        region: config.signingRegion,
                        service: config.signingName,
                        sha256,
                        uriEscapePath: signingEscapePath
                    };
                    const SignerCtor = config.signerConstructor || _smithy_signature_v4__rspack_import_1.BB;
                    return new SignerCtor(params);
                }) : async (authScheme)=>{
                authScheme = Object.assign({}, {
                    name: "sigv4",
                    signingName: config.signingName || config.defaultSigningName,
                    signingRegion: await (0, _smithy_core__rspack_import_0.te)(config.region)(),
                    properties: {}
                }, authScheme);
                const signingRegion = authScheme.signingRegion;
                const signingService = authScheme.signingName;
                config.signingRegion = config.signingRegion || signingRegion;
                config.signingName = config.signingName || signingService || config.serviceId;
                const params = {
                    ...config,
                    credentials: normalizedCreds,
                    region: config.signingRegion,
                    service: config.signingName,
                    sha256,
                    uriEscapePath: signingEscapePath
                };
                const SignerCtor = config.signerConstructor || _smithy_signature_v4__rspack_import_1.BB;
                return new SignerCtor(params);
            };
            return {
                ...config,
                systemClockOffset,
                signingEscapePath,
                credentials: normalizedCreds,
                signer
            };
        };
    },
    "../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/protocols/json/parseJsonBody.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            CG: ()=>parseJsonErrorBody,
            Y2: ()=>parseJsonBody,
            cJ: ()=>loadRestJsonErrorCode
        });
        var _common__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/protocols/common.js");
        const parseJsonBody = (streamBody, context)=>(0, _common__rspack_import_0.w)(streamBody, context).then((encoded)=>{
                if (encoded.length) try {
                    return JSON.parse(encoded);
                } catch (e) {
                    if (e?.name === "SyntaxError") Object.defineProperty(e, "$responseBodyText", {
                        value: encoded
                    });
                    throw e;
                }
                return {};
            });
        const parseJsonErrorBody = async (errorBody, context)=>{
            const value = await parseJsonBody(errorBody, context);
            value.message = value.message ?? value.Message;
            return value;
        };
        const loadRestJsonErrorCode = (output, data)=>{
            const findKey = (object, key)=>Object.keys(object).find((k)=>k.toLowerCase() === key.toLowerCase());
            const sanitizeErrorCode = (rawValue)=>{
                let cleanValue = rawValue;
                if ("number" == typeof cleanValue) cleanValue = cleanValue.toString();
                if (cleanValue.indexOf(",") >= 0) cleanValue = cleanValue.split(",")[0];
                if (cleanValue.indexOf(":") >= 0) cleanValue = cleanValue.split(":")[0];
                if (cleanValue.indexOf("#") >= 0) cleanValue = cleanValue.split("#")[1];
                return cleanValue;
            };
            const headerKey = findKey(output.headers, "x-amzn-errortype");
            if (void 0 !== headerKey) return sanitizeErrorCode(output.headers[headerKey]);
            if (void 0 !== data.code) return sanitizeErrorCode(data.code);
            if (void 0 !== data["__type"]) return sanitizeErrorCode(data["__type"]);
        };
    },
    "../../../node_modules/.pnpm/@aws-sdk+token-providers@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/token-providers/dist-es/loadSsoOidc.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            CreateTokenCommand: ()=>CreateTokenCommand,
            SSOOIDCClient: ()=>SSOOIDCClient
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@2.5.0/node_modules/@smithy/middleware-endpoint/dist-es/index.js");
        var serdePlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-serde@2.3.0/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js");
        var smithy_client_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@2.5.0/node_modules/@smithy/smithy-client/dist-es/index.js");
        const resolveClientEndpointParameters = (options)=>({
                ...options,
                useDualstackEndpoint: options.useDualstackEndpoint ?? false,
                useFipsEndpoint: options.useFipsEndpoint ?? false,
                defaultSigningName: "sso-oauth"
            });
        const commonParams = {
            UseFIPS: {
                type: "builtInParams",
                name: "useFipsEndpoint"
            },
            Endpoint: {
                type: "builtInParams",
                name: "endpoint"
            },
            Region: {
                type: "builtInParams",
                name: "region"
            },
            UseDualStack: {
                type: "builtInParams",
                name: "useDualstackEndpoint"
            }
        };
        class SSOOIDCServiceException extends smithy_client_dist_es.TJ {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, SSOOIDCServiceException.prototype);
            }
        }
        class AccessDeniedException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "AccessDeniedException",
                    $fault: "client",
                    ...opts
                });
                this.name = "AccessDeniedException";
                this.$fault = "client";
                Object.setPrototypeOf(this, AccessDeniedException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class AuthorizationPendingException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "AuthorizationPendingException",
                    $fault: "client",
                    ...opts
                });
                this.name = "AuthorizationPendingException";
                this.$fault = "client";
                Object.setPrototypeOf(this, AuthorizationPendingException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class ExpiredTokenException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "ExpiredTokenException",
                    $fault: "client",
                    ...opts
                });
                this.name = "ExpiredTokenException";
                this.$fault = "client";
                Object.setPrototypeOf(this, ExpiredTokenException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InternalServerException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InternalServerException",
                    $fault: "server",
                    ...opts
                });
                this.name = "InternalServerException";
                this.$fault = "server";
                Object.setPrototypeOf(this, InternalServerException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidClientException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidClientException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidClientException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidClientException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidGrantException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidGrantException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidGrantException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidGrantException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidRequestException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidRequestException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidRequestException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidRequestException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidScopeException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidScopeException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidScopeException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidScopeException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class SlowDownException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "SlowDownException",
                    $fault: "client",
                    ...opts
                });
                this.name = "SlowDownException";
                this.$fault = "client";
                Object.setPrototypeOf(this, SlowDownException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class UnauthorizedClientException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "UnauthorizedClientException",
                    $fault: "client",
                    ...opts
                });
                this.name = "UnauthorizedClientException";
                this.$fault = "client";
                Object.setPrototypeOf(this, UnauthorizedClientException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class UnsupportedGrantTypeException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "UnsupportedGrantTypeException",
                    $fault: "client",
                    ...opts
                });
                this.name = "UnsupportedGrantTypeException";
                this.$fault = "client";
                Object.setPrototypeOf(this, UnsupportedGrantTypeException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidRequestRegionException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidRequestRegionException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidRequestRegionException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidRequestRegionException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
                this.endpoint = opts.endpoint;
                this.region = opts.region;
            }
        }
        class InvalidClientMetadataException extends SSOOIDCServiceException {
            constructor(opts){
                super({
                    name: "InvalidClientMetadataException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidClientMetadataException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidClientMetadataException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        const CreateTokenRequestFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.clientSecret && {
                    clientSecret: smithy_client_dist_es.$H
                },
                ...obj.refreshToken && {
                    refreshToken: smithy_client_dist_es.$H
                }
            });
        const CreateTokenResponseFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.accessToken && {
                    accessToken: smithy_client_dist_es.$H
                },
                ...obj.refreshToken && {
                    refreshToken: smithy_client_dist_es.$H
                },
                ...obj.idToken && {
                    idToken: smithy_client_dist_es.$H
                }
            });
        var parseJsonBody = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/protocols/json/parseJsonBody.js");
        var core_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@1.4.0/node_modules/@smithy/core/dist-es/index.js");
        const se_CreateTokenCommand = async (input, context)=>{
            const b = (0, core_dist_es.lI)(input, context);
            const headers = {
                "content-type": "application/json"
            };
            b.bp("/token");
            let body;
            body = JSON.stringify((0, smithy_client_dist_es.s)(input, {
                clientId: [],
                clientSecret: [],
                code: [],
                deviceCode: [],
                grantType: [],
                redirectUri: [],
                refreshToken: [],
                scope: (_)=>(0, smithy_client_dist_es.Ss)(_)
            }));
            b.m("POST").h(headers).b(body);
            return b.build();
        };
        const de_CreateTokenCommand = async (output, context)=>{
            if (200 !== output.statusCode && output.statusCode >= 300) return de_CommandError(output, context);
            const contents = (0, smithy_client_dist_es.Tj)({
                $metadata: deserializeMetadata(output)
            });
            const data = (0, smithy_client_dist_es.Y0)((0, smithy_client_dist_es.Xk)(await (0, parseJsonBody.Y2)(output.body, context)), "body");
            const doc = (0, smithy_client_dist_es.s)(data, {
                accessToken: smithy_client_dist_es.lK,
                expiresIn: smithy_client_dist_es.ET,
                idToken: smithy_client_dist_es.lK,
                refreshToken: smithy_client_dist_es.lK,
                tokenType: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            return contents;
        };
        const de_CommandError = async (output, context)=>{
            const parsedOutput = {
                ...output,
                body: await (0, parseJsonBody.CG)(output.body, context)
            };
            const errorCode = (0, parseJsonBody.cJ)(output, parsedOutput.body);
            switch(errorCode){
                case "AccessDeniedException":
                case "com.amazonaws.ssooidc#AccessDeniedException":
                    throw await de_AccessDeniedExceptionRes(parsedOutput, context);
                case "AuthorizationPendingException":
                case "com.amazonaws.ssooidc#AuthorizationPendingException":
                    throw await de_AuthorizationPendingExceptionRes(parsedOutput, context);
                case "ExpiredTokenException":
                case "com.amazonaws.ssooidc#ExpiredTokenException":
                    throw await de_ExpiredTokenExceptionRes(parsedOutput, context);
                case "InternalServerException":
                case "com.amazonaws.ssooidc#InternalServerException":
                    throw await de_InternalServerExceptionRes(parsedOutput, context);
                case "InvalidClientException":
                case "com.amazonaws.ssooidc#InvalidClientException":
                    throw await de_InvalidClientExceptionRes(parsedOutput, context);
                case "InvalidGrantException":
                case "com.amazonaws.ssooidc#InvalidGrantException":
                    throw await de_InvalidGrantExceptionRes(parsedOutput, context);
                case "InvalidRequestException":
                case "com.amazonaws.ssooidc#InvalidRequestException":
                    throw await de_InvalidRequestExceptionRes(parsedOutput, context);
                case "InvalidScopeException":
                case "com.amazonaws.ssooidc#InvalidScopeException":
                    throw await de_InvalidScopeExceptionRes(parsedOutput, context);
                case "SlowDownException":
                case "com.amazonaws.ssooidc#SlowDownException":
                    throw await de_SlowDownExceptionRes(parsedOutput, context);
                case "UnauthorizedClientException":
                case "com.amazonaws.ssooidc#UnauthorizedClientException":
                    throw await de_UnauthorizedClientExceptionRes(parsedOutput, context);
                case "UnsupportedGrantTypeException":
                case "com.amazonaws.ssooidc#UnsupportedGrantTypeException":
                    throw await de_UnsupportedGrantTypeExceptionRes(parsedOutput, context);
                case "InvalidRequestRegionException":
                case "com.amazonaws.ssooidc#InvalidRequestRegionException":
                    throw await de_InvalidRequestRegionExceptionRes(parsedOutput, context);
                case "InvalidClientMetadataException":
                case "com.amazonaws.ssooidc#InvalidClientMetadataException":
                    throw await de_InvalidClientMetadataExceptionRes(parsedOutput, context);
                default:
                    const parsedBody = parsedOutput.body;
                    return throwDefaultError({
                        output,
                        parsedBody,
                        errorCode
                    });
            }
        };
        const throwDefaultError = (0, smithy_client_dist_es.jr)(SSOOIDCServiceException);
        const de_AccessDeniedExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new AccessDeniedException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_AuthorizationPendingExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new AuthorizationPendingException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_ExpiredTokenExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new ExpiredTokenException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InternalServerExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InternalServerException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidClientExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidClientException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidClientMetadataExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidClientMetadataException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidGrantExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidGrantException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidRequestExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidRequestException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidRequestRegionExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                endpoint: smithy_client_dist_es.lK,
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK,
                region: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidRequestRegionException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_InvalidScopeExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new InvalidScopeException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_SlowDownExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new SlowDownException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_UnauthorizedClientExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new UnauthorizedClientException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const de_UnsupportedGrantTypeExceptionRes = async (parsedOutput, context)=>{
            const contents = (0, smithy_client_dist_es.Tj)({});
            const data = parsedOutput.body;
            const doc = (0, smithy_client_dist_es.s)(data, {
                error: smithy_client_dist_es.lK,
                error_description: smithy_client_dist_es.lK
            });
            Object.assign(contents, doc);
            const exception = new UnsupportedGrantTypeException({
                $metadata: deserializeMetadata(parsedOutput),
                ...contents
            });
            return (0, smithy_client_dist_es.Mw)(exception, parsedOutput.body);
        };
        const deserializeMetadata = (output)=>({
                httpStatusCode: output.statusCode,
                requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
                extendedRequestId: output.headers["x-amz-id-2"],
                cfId: output.headers["x-amz-cf-id"]
            });
        class CreateTokenCommand extends smithy_client_dist_es.uB.classBuilder().ep({
            ...commonParams
        }).m(function(Command, cs, config, o) {
            return [
                (0, serdePlugin.TM)(config, this.serialize, this.deserialize),
                (0, dist_es.rD)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSSOOIDCService", "CreateToken", {}).n("SSOOIDCClient", "CreateTokenCommand").f(CreateTokenRequestFilterSensitiveLog, CreateTokenResponseFilterSensitiveLog).ser(se_CreateTokenCommand).de(de_CreateTokenCommand).build() {
        }
        var middleware_host_header_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-host-header@3.535.0/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js");
        var loggerMiddleware = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-logger@3.535.0/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js");
        var middleware_recursion_detection_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-recursion-detection@3.535.0/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/index.js");
        var middleware_user_agent_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.540.0/node_modules/@aws-sdk/middleware-user-agent/dist-es/index.js");
        var config_resolver_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@2.2.0/node_modules/@smithy/config-resolver/dist-es/index.js");
        var middleware_content_length_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-content-length@2.2.0/node_modules/@smithy/middleware-content-length/dist-es/index.js");
        var middleware_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@2.2.0/node_modules/@smithy/middleware-retry/dist-es/index.js");
        var resolveAwsSdkSigV4Config = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
        var util_middleware_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@2.2.0/node_modules/@smithy/util-middleware/dist-es/index.js");
        const defaultSSOOIDCHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, util_middleware_dist_es.u)(context).operation,
                region: await (0, util_middleware_dist_es.t)(config.region)() || (()=>{
                    throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
                })()
            });
        function createAwsAuthSigv4HttpAuthOption(authParameters) {
            return {
                schemeId: "aws.auth#sigv4",
                signingProperties: {
                    name: "sso-oauth",
                    region: authParameters.region
                },
                propertiesExtractor: (config, context)=>({
                        signingProperties: {
                            config,
                            context
                        }
                    })
            };
        }
        function createSmithyApiNoAuthHttpAuthOption(authParameters) {
            return {
                schemeId: "smithy.api#noAuth"
            };
        }
        const defaultSSOOIDCHttpAuthSchemeProvider = (authParameters)=>{
            const options = [];
            switch(authParameters.operation){
                case "CreateToken":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                case "RegisterClient":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                case "StartDeviceAuthorization":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                default:
                    options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
            }
            return options;
        };
        const resolveHttpAuthSchemeConfig = (config)=>{
            const config_0 = (0, resolveAwsSdkSigV4Config.h)(config);
            return {
                ...config_0
            };
        };
        var package_namespaceObject = {
            rE: "3.540.0"
        };
        const credentialDefaultProvider_defaultProvider = (input)=>()=>Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-node/dist-es/index.js")).then(({ defaultProvider })=>defaultProvider(input)());
        var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/client/emitWarningIfUnsupportedVersion.js");
        var util_user_agent_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.535.0/node_modules/@aws-sdk/util-user-agent-node/dist-es/index.js");
        var hash_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+hash-node@2.2.0/node_modules/@smithy/hash-node/dist-es/index.js");
        var node_config_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@2.3.0/node_modules/@smithy/node-config-provider/dist-es/index.js");
        var node_http_handler_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@2.5.0/node_modules/@smithy/node-http-handler/dist-es/index.js");
        var util_body_length_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-body-length-node@2.3.0/node_modules/@smithy/util-body-length-node/dist-es/index.js");
        var util_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-retry@2.2.0/node_modules/@smithy/util-retry/dist-es/index.js");
        var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
        var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@2.2.0/node_modules/@smithy/url-parser/dist-es/index.js");
        var util_base64_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@2.3.0/node_modules/@smithy/util-base64/dist-es/index.js");
        var util_utf8_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@2.3.0/node_modules/@smithy/util-utf8/dist-es/index.js");
        var util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.540.0/node_modules/@aws-sdk/util-endpoints/dist-es/index.js");
        var _smithy_util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@1.2.0/node_modules/@smithy/util-endpoints/dist-es/index.js");
        const u = "required", v = "fn", w = "argv", x = "ref";
        const a = true, ruleset_b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "getAttr", i = {
            [u]: false,
            type: "String"
        }, j = {
            [u]: true,
            default: false,
            type: "Boolean"
        }, k = {
            [x]: "Endpoint"
        }, l = {
            [v]: c,
            [w]: [
                {
                    [x]: "UseFIPS"
                },
                true
            ]
        }, m = {
            [v]: c,
            [w]: [
                {
                    [x]: "UseDualStack"
                },
                true
            ]
        }, n = {}, ruleset_o = {
            [v]: h,
            [w]: [
                {
                    [x]: g
                },
                "supportsFIPS"
            ]
        }, p = {
            [x]: g
        }, q = {
            [v]: c,
            [w]: [
                true,
                {
                    [v]: h,
                    [w]: [
                        p,
                        "supportsDualStack"
                    ]
                }
            ]
        }, r = [
            l
        ], s = [
            m
        ], ruleset_t = [
            {
                [x]: "Region"
            }
        ];
        const _data = {
            version: "1.0",
            parameters: {
                Region: i,
                UseDualStack: j,
                UseFIPS: j,
                Endpoint: i
            },
            rules: [
                {
                    conditions: [
                        {
                            [v]: ruleset_b,
                            [w]: [
                                k
                            ]
                        }
                    ],
                    rules: [
                        {
                            conditions: r,
                            error: "Invalid Configuration: FIPS and custom endpoint are not supported",
                            type: d
                        },
                        {
                            conditions: s,
                            error: "Invalid Configuration: Dualstack and custom endpoint are not supported",
                            type: d
                        },
                        {
                            endpoint: {
                                url: k,
                                properties: n,
                                headers: n
                            },
                            type: e
                        }
                    ],
                    type: f
                },
                {
                    conditions: [
                        {
                            [v]: ruleset_b,
                            [w]: ruleset_t
                        }
                    ],
                    rules: [
                        {
                            conditions: [
                                {
                                    [v]: "aws.partition",
                                    [w]: ruleset_t,
                                    assign: g
                                }
                            ],
                            rules: [
                                {
                                    conditions: [
                                        l,
                                        m
                                    ],
                                    rules: [
                                        {
                                            conditions: [
                                                {
                                                    [v]: c,
                                                    [w]: [
                                                        a,
                                                        ruleset_o
                                                    ]
                                                },
                                                q
                                            ],
                                            rules: [
                                                {
                                                    endpoint: {
                                                        url: "https://oidc-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                                                        properties: n,
                                                        headers: n
                                                    },
                                                    type: e
                                                }
                                            ],
                                            type: f
                                        },
                                        {
                                            error: "FIPS and DualStack are enabled, but this partition does not support one or both",
                                            type: d
                                        }
                                    ],
                                    type: f
                                },
                                {
                                    conditions: r,
                                    rules: [
                                        {
                                            conditions: [
                                                {
                                                    [v]: c,
                                                    [w]: [
                                                        ruleset_o,
                                                        a
                                                    ]
                                                }
                                            ],
                                            rules: [
                                                {
                                                    conditions: [
                                                        {
                                                            [v]: "stringEquals",
                                                            [w]: [
                                                                {
                                                                    [v]: h,
                                                                    [w]: [
                                                                        p,
                                                                        "name"
                                                                    ]
                                                                },
                                                                "aws-us-gov"
                                                            ]
                                                        }
                                                    ],
                                                    endpoint: {
                                                        url: "https://oidc.{Region}.amazonaws.com",
                                                        properties: n,
                                                        headers: n
                                                    },
                                                    type: e
                                                },
                                                {
                                                    endpoint: {
                                                        url: "https://oidc-fips.{Region}.{PartitionResult#dnsSuffix}",
                                                        properties: n,
                                                        headers: n
                                                    },
                                                    type: e
                                                }
                                            ],
                                            type: f
                                        },
                                        {
                                            error: "FIPS is enabled but this partition does not support FIPS",
                                            type: d
                                        }
                                    ],
                                    type: f
                                },
                                {
                                    conditions: s,
                                    rules: [
                                        {
                                            conditions: [
                                                q
                                            ],
                                            rules: [
                                                {
                                                    endpoint: {
                                                        url: "https://oidc.{Region}.{PartitionResult#dualStackDnsSuffix}",
                                                        properties: n,
                                                        headers: n
                                                    },
                                                    type: e
                                                }
                                            ],
                                            type: f
                                        },
                                        {
                                            error: "DualStack is enabled but this partition does not support DualStack",
                                            type: d
                                        }
                                    ],
                                    type: f
                                },
                                {
                                    endpoint: {
                                        url: "https://oidc.{Region}.{PartitionResult#dnsSuffix}",
                                        properties: n,
                                        headers: n
                                    },
                                    type: e
                                }
                            ],
                            type: f
                        }
                    ],
                    type: f
                },
                {
                    error: "Invalid Configuration: Missing Region",
                    type: d
                }
            ]
        };
        const ruleSet = _data;
        const defaultEndpointResolver = (endpointParams, context = {})=>(0, _smithy_util_endpoints_dist_es.sO)(ruleSet, {
                endpointParams: endpointParams,
                logger: context.logger
            });
        _smithy_util_endpoints_dist_es.mw.aws = util_endpoints_dist_es.UF;
        const getRuntimeConfig = (config)=>({
                apiVersion: "2019-06-10",
                base64Decoder: config?.base64Decoder ?? util_base64_dist_es.E,
                base64Encoder: config?.base64Encoder ?? util_base64_dist_es.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOOIDCHttpAuthSchemeProvider,
                httpAuthSchemes: config?.httpAuthSchemes ?? [
                    {
                        schemeId: "aws.auth#sigv4",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("aws.auth#sigv4"),
                        signer: new AwsSdkSigV4Signer.f()
                    },
                    {
                        schemeId: "smithy.api#noAuth",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("smithy.api#noAuth") || (async ()=>({})),
                        signer: new core_dist_es.mR()
                    }
                ],
                logger: config?.logger ?? new smithy_client_dist_es.N4(),
                serviceId: config?.serviceId ?? "SSO OIDC",
                urlParser: config?.urlParser ?? url_parser_dist_es.D,
                utf8Decoder: config?.utf8Decoder ?? util_utf8_dist_es.ar,
                utf8Encoder: config?.utf8Encoder ?? util_utf8_dist_es.Pq
            });
        var util_defaults_mode_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@2.3.0/node_modules/@smithy/util-defaults-mode-node/dist-es/index.js");
        const runtimeConfig_getRuntimeConfig = (config)=>{
            (0, smithy_client_dist_es.I9)(process.version);
            const defaultsMode = (0, util_defaults_mode_node_dist_es.I)(config);
            const defaultConfigProvider = ()=>defaultsMode().then(smithy_client_dist_es.lT);
            const clientSharedValues = getRuntimeConfig(config);
            (0, emitWarningIfUnsupportedVersion.I)(process.version);
            return {
                ...clientSharedValues,
                ...config,
                runtime: "node",
                defaultsMode,
                bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_dist_es.n,
                credentialDefaultProvider: config?.credentialDefaultProvider ?? credentialDefaultProvider_defaultProvider,
                defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_dist_es.mJ)({
                    serviceId: clientSharedValues.serviceId,
                    clientVersion: package_namespaceObject.rE
                }),
                maxAttempts: config?.maxAttempts ?? (0, node_config_provider_dist_es.Z)(middleware_retry_dist_es.qs),
                region: config?.region ?? (0, node_config_provider_dist_es.Z)(config_resolver_dist_es.GG, config_resolver_dist_es.zH),
                requestHandler: node_http_handler_dist_es.$c.create(config?.requestHandler ?? defaultConfigProvider),
                retryMode: config?.retryMode ?? (0, node_config_provider_dist_es.Z)({
                    ...middleware_retry_dist_es.kN,
                    default: async ()=>(await defaultConfigProvider()).retryMode || util_retry_dist_es.L0
                }),
                sha256: config?.sha256 ?? hash_node_dist_es.V.bind(null, "sha256"),
                streamCollector: config?.streamCollector ?? node_http_handler_dist_es.kv,
                useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_dist_es.Z)(config_resolver_dist_es.e$),
                useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_dist_es.Z)(config_resolver_dist_es.Ko)
            };
        };
        var dist_es_extensions = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+region-config-resolver@3.535.0/node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js");
        var protocol_http_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@3.3.0/node_modules/@smithy/protocol-http/dist-es/index.js");
        const getHttpAuthExtensionConfiguration = (runtimeConfig)=>{
            const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
            let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
            let _credentials = runtimeConfig.credentials;
            return {
                setHttpAuthScheme (httpAuthScheme) {
                    const index = _httpAuthSchemes.findIndex((scheme)=>scheme.schemeId === httpAuthScheme.schemeId);
                    if (-1 === index) _httpAuthSchemes.push(httpAuthScheme);
                    else _httpAuthSchemes.splice(index, 1, httpAuthScheme);
                },
                httpAuthSchemes () {
                    return _httpAuthSchemes;
                },
                setHttpAuthSchemeProvider (httpAuthSchemeProvider) {
                    _httpAuthSchemeProvider = httpAuthSchemeProvider;
                },
                httpAuthSchemeProvider () {
                    return _httpAuthSchemeProvider;
                },
                setCredentials (credentials) {
                    _credentials = credentials;
                },
                credentials () {
                    return _credentials;
                }
            };
        };
        const resolveHttpAuthRuntimeConfig = (config)=>({
                httpAuthSchemes: config.httpAuthSchemes(),
                httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
                credentials: config.credentials()
            });
        const asPartial = (t)=>t;
        const resolveRuntimeExtensions = (runtimeConfig, extensions)=>{
            const extensionConfiguration = {
                ...asPartial((0, dist_es_extensions.R)(runtimeConfig)),
                ...asPartial((0, smithy_client_dist_es.xA)(runtimeConfig)),
                ...asPartial((0, protocol_http_dist_es.eS)(runtimeConfig)),
                ...asPartial(getHttpAuthExtensionConfiguration(runtimeConfig))
            };
            extensions.forEach((extension)=>extension.configure(extensionConfiguration));
            return {
                ...runtimeConfig,
                ...(0, dist_es_extensions.$)(extensionConfiguration),
                ...(0, smithy_client_dist_es.uv)(extensionConfiguration),
                ...(0, protocol_http_dist_es.jt)(extensionConfiguration),
                ...resolveHttpAuthRuntimeConfig(extensionConfiguration)
            };
        };
        class SSOOIDCClient extends smithy_client_dist_es.Kj {
            constructor(...[configuration]){
                const _config_0 = runtimeConfig_getRuntimeConfig(configuration || {});
                const _config_1 = resolveClientEndpointParameters(_config_0);
                const _config_2 = (0, config_resolver_dist_es.TD)(_config_1);
                const _config_3 = (0, dist_es.Co)(_config_2);
                const _config_4 = (0, middleware_retry_dist_es.$z)(_config_3);
                const _config_5 = (0, middleware_host_header_dist_es.OV)(_config_4);
                const _config_6 = (0, middleware_user_agent_dist_es.Dc)(_config_5);
                const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
                const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
                super(_config_8);
                this.config = _config_8;
                this.middlewareStack.use((0, middleware_retry_dist_es.ey)(this.config));
                this.middlewareStack.use((0, middleware_content_length_dist_es.vK)(this.config));
                this.middlewareStack.use((0, middleware_host_header_dist_es.TC)(this.config));
                this.middlewareStack.use((0, loggerMiddleware.Y7)(this.config));
                this.middlewareStack.use((0, middleware_recursion_detection_dist_es.n4)(this.config));
                this.middlewareStack.use((0, middleware_user_agent_dist_es.sM)(this.config));
                this.middlewareStack.use((0, core_dist_es.wB)(this.config, {
                    httpAuthSchemeParametersProvider: this.getDefaultHttpAuthSchemeParametersProvider(),
                    identityProviderConfigProvider: this.getIdentityProviderConfigProvider()
                }));
                this.middlewareStack.use((0, core_dist_es.lW)(this.config));
            }
            destroy() {
                super.destroy();
            }
            getDefaultHttpAuthSchemeParametersProvider() {
                return defaultSSOOIDCHttpAuthSchemeParametersProvider;
            }
            getIdentityProviderConfigProvider() {
                return async (config)=>new core_dist_es.h$({
                        "aws.auth#sigv4": config.credentials
                    });
            }
        }
    }
};
