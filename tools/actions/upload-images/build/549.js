"use strict";
exports.ids = [
    549
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sso-oidc/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            CreateTokenCommand: ()=>CreateTokenCommand,
            SSOOIDCClient: ()=>SSOOIDCClient
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-host-header@3.972.8/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js");
        var loggerMiddleware = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-logger@3.972.8/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js");
        var getRecursionDetectionPlugin = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-recursion-detection@3.972.9/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/getRecursionDetectionPlugin.js");
        var configurations = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.972.27/node_modules/@aws-sdk/middleware-user-agent/dist-es/configurations.js");
        var user_agent_middleware = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.972.27/node_modules/@aws-sdk/middleware-user-agent/dist-es/user-agent-middleware.js");
        var resolveRegionConfig = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js");
        var getHttpAuthSchemeEndpointRuleSetPlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js");
        var DefaultIdentityProviderConfig = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js");
        var getHttpSigningMiddleware = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js");
        var getSchemaSerdePlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/middleware/getSchemaSerdePlugin.js");
        var middleware_content_length_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-content-length@4.2.12/node_modules/@smithy/middleware-content-length/dist-es/index.js");
        var resolveEndpointConfig = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@4.4.28/node_modules/@smithy/middleware-endpoint/dist-es/resolveEndpointConfig.js");
        var dist_es_configurations = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@4.4.45/node_modules/@smithy/middleware-retry/dist-es/configurations.js");
        var retryMiddleware = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@4.4.45/node_modules/@smithy/middleware-retry/dist-es/retryMiddleware.js");
        var client = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/client.js");
        var resolveAwsSdkSigV4Config = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
        var getSmithyContext = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@4.2.12/node_modules/@smithy/util-middleware/dist-es/getSmithyContext.js");
        var normalizeProvider = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@4.2.12/node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js");
        const defaultSSOOIDCHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, getSmithyContext.u)(context).operation,
                region: await (0, normalizeProvider.t)(config.region)() || (()=>{
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
                default:
                    options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
            }
            return options;
        };
        const resolveHttpAuthSchemeConfig = (config)=>{
            const config_0 = (0, resolveAwsSdkSigV4Config.h)(config);
            return Object.assign(config_0, {
                authSchemePreference: (0, normalizeProvider.t)(config.authSchemePreference ?? [])
            });
        };
        const resolveClientEndpointParameters = (options)=>Object.assign(options, {
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
        var nested_clients_package = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/package.json");
        var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
        var NODE_AUTH_SCHEME_PREFERENCE_OPTIONS = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.js");
        var defaultUserAgent = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.973.13/node_modules/@aws-sdk/util-user-agent-node/dist-es/defaultUserAgent.js");
        var nodeAppIdConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.973.13/node_modules/@aws-sdk/util-user-agent-node/dist-es/nodeAppIdConfigOptions.js");
        var regionConfig_config = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js");
        var NodeUseDualstackEndpointConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js");
        var NodeUseFipsEndpointConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js");
        var hash_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+hash-node@4.2.12/node_modules/@smithy/hash-node/dist-es/index.js");
        var configLoader = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@4.3.12/node_modules/@smithy/node-config-provider/dist-es/configLoader.js");
        var node_http_handler = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@4.5.1/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
        var stream_collector = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@4.5.1/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js");
        var dist_es_emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js");
        var defaults_mode = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js");
        var calculateBodyLength = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-body-length-node@4.2.3/node_modules/@smithy/util-body-length-node/dist-es/calculateBodyLength.js");
        var resolveDefaultsModeConfig = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@4.2.48/node_modules/@smithy/util-defaults-mode-node/dist-es/resolveDefaultsModeConfig.js");
        var dist_es_config = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-retry@4.2.12/node_modules/@smithy/util-retry/dist-es/config.js");
        var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
        var AwsRestJsonProtocol = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/AwsRestJsonProtocol.js");
        var noAuth = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js");
        var NoOpLogger = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js");
        var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@4.2.12/node_modules/@smithy/url-parser/dist-es/index.js");
        var fromBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/fromBase64.js");
        var toBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/toBase64.js");
        var fromUtf8 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@4.2.2/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js");
        var toUtf8 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@4.2.2/node_modules/@smithy/util-utf8/dist-es/toUtf8.js");
        var util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.996.5/node_modules/@aws-sdk/util-endpoints/dist-es/index.js");
        var EndpointCache = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/cache/EndpointCache.js");
        var resolveEndpoint = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/resolveEndpoint.js");
        var customEndpointFunctions = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js");
        const u = "required", v = "fn", w = "argv", x = "ref";
        const a = true, b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "getAttr", i = {
            [u]: false,
            type: "string"
        }, j = {
            [u]: true,
            default: false,
            type: "boolean"
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
        ], t = [
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
                            [v]: b,
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
                            [v]: b,
                            [w]: t
                        }
                    ],
                    rules: [
                        {
                            conditions: [
                                {
                                    [v]: "aws.partition",
                                    [w]: t,
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
        const cache = new EndpointCache.k({
            size: 50,
            params: [
                "Endpoint",
                "Region",
                "UseDualStack",
                "UseFIPS"
            ]
        });
        const defaultEndpointResolver = (endpointParams, context = {})=>cache.get(endpointParams, ()=>(0, resolveEndpoint.s)(ruleSet, {
                    endpointParams: endpointParams,
                    logger: context.logger
                }));
        customEndpointFunctions.m.aws = util_endpoints_dist_es.UF;
        var TypeRegistry = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js");
        var exceptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/exceptions.js");
        class SSOOIDCServiceException extends exceptions.T {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, SSOOIDCServiceException.prototype);
            }
        }
        class AccessDeniedException extends SSOOIDCServiceException {
            name = "AccessDeniedException";
            $fault = "client";
            error;
            reason;
            error_description;
            constructor(opts){
                super({
                    name: "AccessDeniedException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, AccessDeniedException.prototype);
                this.error = opts.error;
                this.reason = opts.reason;
                this.error_description = opts.error_description;
            }
        }
        class AuthorizationPendingException extends SSOOIDCServiceException {
            name = "AuthorizationPendingException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "AuthorizationPendingException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, AuthorizationPendingException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class ExpiredTokenException extends SSOOIDCServiceException {
            name = "ExpiredTokenException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "ExpiredTokenException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, ExpiredTokenException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InternalServerException extends SSOOIDCServiceException {
            name = "InternalServerException";
            $fault = "server";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "InternalServerException",
                    $fault: "server",
                    ...opts
                });
                Object.setPrototypeOf(this, InternalServerException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidClientException extends SSOOIDCServiceException {
            name = "InvalidClientException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "InvalidClientException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidClientException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidGrantException extends SSOOIDCServiceException {
            name = "InvalidGrantException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "InvalidGrantException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidGrantException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class InvalidRequestException extends SSOOIDCServiceException {
            name = "InvalidRequestException";
            $fault = "client";
            error;
            reason;
            error_description;
            constructor(opts){
                super({
                    name: "InvalidRequestException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidRequestException.prototype);
                this.error = opts.error;
                this.reason = opts.reason;
                this.error_description = opts.error_description;
            }
        }
        class InvalidScopeException extends SSOOIDCServiceException {
            name = "InvalidScopeException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "InvalidScopeException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidScopeException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class SlowDownException extends SSOOIDCServiceException {
            name = "SlowDownException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "SlowDownException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, SlowDownException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class UnauthorizedClientException extends SSOOIDCServiceException {
            name = "UnauthorizedClientException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "UnauthorizedClientException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, UnauthorizedClientException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        class UnsupportedGrantTypeException extends SSOOIDCServiceException {
            name = "UnsupportedGrantTypeException";
            $fault = "client";
            error;
            error_description;
            constructor(opts){
                super({
                    name: "UnsupportedGrantTypeException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, UnsupportedGrantTypeException.prototype);
                this.error = opts.error;
                this.error_description = opts.error_description;
            }
        }
        const _ADE = "AccessDeniedException";
        const _APE = "AuthorizationPendingException";
        const _AT = "AccessToken";
        const _CS = "ClientSecret";
        const _CT = "CreateToken";
        const _CTR = "CreateTokenRequest";
        const _CTRr = "CreateTokenResponse";
        const _CV = "CodeVerifier";
        const _ETE = "ExpiredTokenException";
        const _ICE = "InvalidClientException";
        const _IGE = "InvalidGrantException";
        const _IRE = "InvalidRequestException";
        const _ISE = "InternalServerException";
        const _ISEn = "InvalidScopeException";
        const _IT = "IdToken";
        const _RT = "RefreshToken";
        const _SDE = "SlowDownException";
        const _UCE = "UnauthorizedClientException";
        const _UGTE = "UnsupportedGrantTypeException";
        const _aT = "accessToken";
        const _c = "client";
        const _cI = "clientId";
        const _cS = "clientSecret";
        const _cV = "codeVerifier";
        const _co = "code";
        const _dC = "deviceCode";
        const _e = "error";
        const _eI = "expiresIn";
        const _ed = "error_description";
        const _gT = "grantType";
        const _h = "http";
        const _hE = "httpError";
        const _iT = "idToken";
        const _r = "reason";
        const _rT = "refreshToken";
        const _rU = "redirectUri";
        const _s = "smithy.ts.sdk.synthetic.com.amazonaws.ssooidc";
        const _sc = "scope";
        const _se = "server";
        const _tT = "tokenType";
        const n0 = "com.amazonaws.ssooidc";
        const _s_registry = TypeRegistry.O["for"](_s);
        var SSOOIDCServiceException$ = [
            -3,
            _s,
            "SSOOIDCServiceException",
            0,
            [],
            []
        ];
        _s_registry.registerError(SSOOIDCServiceException$, SSOOIDCServiceException);
        const n0_registry = TypeRegistry.O["for"](n0);
        var AccessDeniedException$ = [
            -3,
            n0,
            _ADE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _r,
                _ed
            ],
            [
                0,
                0,
                0
            ]
        ];
        n0_registry.registerError(AccessDeniedException$, AccessDeniedException);
        var AuthorizationPendingException$ = [
            -3,
            n0,
            _APE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(AuthorizationPendingException$, AuthorizationPendingException);
        var ExpiredTokenException$ = [
            -3,
            n0,
            _ETE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(ExpiredTokenException$, ExpiredTokenException);
        var InternalServerException$ = [
            -3,
            n0,
            _ISE,
            {
                [_e]: _se,
                [_hE]: 500
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(InternalServerException$, InternalServerException);
        var InvalidClientException$ = [
            -3,
            n0,
            _ICE,
            {
                [_e]: _c,
                [_hE]: 401
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(InvalidClientException$, InvalidClientException);
        var InvalidGrantException$ = [
            -3,
            n0,
            _IGE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(InvalidGrantException$, InvalidGrantException);
        var InvalidRequestException$ = [
            -3,
            n0,
            _IRE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _r,
                _ed
            ],
            [
                0,
                0,
                0
            ]
        ];
        n0_registry.registerError(InvalidRequestException$, InvalidRequestException);
        var InvalidScopeException$ = [
            -3,
            n0,
            _ISEn,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(InvalidScopeException$, InvalidScopeException);
        var SlowDownException$ = [
            -3,
            n0,
            _SDE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(SlowDownException$, SlowDownException);
        var UnauthorizedClientException$ = [
            -3,
            n0,
            _UCE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(UnauthorizedClientException$, UnauthorizedClientException);
        var UnsupportedGrantTypeException$ = [
            -3,
            n0,
            _UGTE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _ed
            ],
            [
                0,
                0
            ]
        ];
        n0_registry.registerError(UnsupportedGrantTypeException$, UnsupportedGrantTypeException);
        const errorTypeRegistries = [
            _s_registry,
            n0_registry
        ];
        var AccessToken = [
            0,
            n0,
            _AT,
            8,
            0
        ];
        var ClientSecret = [
            0,
            n0,
            _CS,
            8,
            0
        ];
        var CodeVerifier = [
            0,
            n0,
            _CV,
            8,
            0
        ];
        var IdToken = [
            0,
            n0,
            _IT,
            8,
            0
        ];
        var RefreshToken = [
            0,
            n0,
            _RT,
            8,
            0
        ];
        var CreateTokenRequest$ = [
            3,
            n0,
            _CTR,
            0,
            [
                _cI,
                _cS,
                _gT,
                _dC,
                _co,
                _rT,
                _sc,
                _rU,
                _cV
            ],
            [
                0,
                [
                    ()=>ClientSecret,
                    0
                ],
                0,
                0,
                0,
                [
                    ()=>RefreshToken,
                    0
                ],
                64,
                0,
                [
                    ()=>CodeVerifier,
                    0
                ]
            ],
            3
        ];
        var CreateTokenResponse$ = [
            3,
            n0,
            _CTRr,
            0,
            [
                _aT,
                _tT,
                _eI,
                _rT,
                _iT
            ],
            [
                [
                    ()=>AccessToken,
                    0
                ],
                0,
                1,
                [
                    ()=>RefreshToken,
                    0
                ],
                [
                    ()=>IdToken,
                    0
                ]
            ]
        ];
        var CreateToken$ = [
            9,
            n0,
            _CT,
            {
                [_h]: [
                    "POST",
                    "/token",
                    200
                ]
            },
            ()=>CreateTokenRequest$,
            ()=>CreateTokenResponse$
        ];
        const getRuntimeConfig = (config)=>({
                apiVersion: "2019-06-10",
                base64Decoder: config?.base64Decoder ?? fromBase64.E,
                base64Encoder: config?.base64Encoder ?? toBase64.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOOIDCHttpAuthSchemeProvider,
                httpAuthSchemes: config?.httpAuthSchemes ?? [
                    {
                        schemeId: "aws.auth#sigv4",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("aws.auth#sigv4"),
                        signer: new AwsSdkSigV4Signer.f2()
                    },
                    {
                        schemeId: "smithy.api#noAuth",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("smithy.api#noAuth") || (async ()=>({})),
                        signer: new noAuth.m()
                    }
                ],
                logger: config?.logger ?? new NoOpLogger.N(),
                protocol: config?.protocol ?? AwsRestJsonProtocol.Y,
                protocolSettings: config?.protocolSettings ?? {
                    defaultNamespace: "com.amazonaws.ssooidc",
                    errorTypeRegistries: errorTypeRegistries,
                    version: "2019-06-10",
                    serviceTarget: "AWSSSOOIDCService"
                },
                serviceId: config?.serviceId ?? "SSO OIDC",
                urlParser: config?.urlParser ?? url_parser_dist_es.D,
                utf8Decoder: config?.utf8Decoder ?? fromUtf8.a,
                utf8Encoder: config?.utf8Encoder ?? toUtf8.P
            });
        const runtimeConfig_getRuntimeConfig = (config)=>{
            (0, dist_es_emitWarningIfUnsupportedVersion.I)(process.version);
            const defaultsMode = (0, resolveDefaultsModeConfig.I)(config);
            const defaultConfigProvider = ()=>defaultsMode().then(defaults_mode.l);
            const clientSharedValues = getRuntimeConfig(config);
            (0, emitWarningIfUnsupportedVersion.I)(process.version);
            const loaderConfig = {
                profile: config?.profile,
                logger: clientSharedValues.logger
            };
            return {
                ...clientSharedValues,
                ...config,
                runtime: "node",
                defaultsMode,
                authSchemePreference: config?.authSchemePreference ?? (0, configLoader.Z)(NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.$, loaderConfig),
                bodyLengthChecker: config?.bodyLengthChecker ?? calculateBodyLength.n,
                defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, defaultUserAgent.pf)({
                    serviceId: clientSharedValues.serviceId,
                    clientVersion: nested_clients_package.rE
                }),
                maxAttempts: config?.maxAttempts ?? (0, configLoader.Z)(dist_es_configurations.qs, config),
                region: config?.region ?? (0, configLoader.Z)(regionConfig_config.GG, {
                    ...regionConfig_config.zH,
                    ...loaderConfig
                }),
                requestHandler: node_http_handler.$.create(config?.requestHandler ?? defaultConfigProvider),
                retryMode: config?.retryMode ?? (0, configLoader.Z)({
                    ...dist_es_configurations.kN,
                    default: async ()=>(await defaultConfigProvider()).retryMode || dist_es_config.L
                }, config),
                sha256: config?.sha256 ?? hash_node_dist_es.V.bind(null, "sha256"),
                streamCollector: config?.streamCollector ?? stream_collector.k,
                useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, configLoader.Z)(NodeUseDualstackEndpointConfigOptions.e$, loaderConfig),
                useFipsEndpoint: config?.useFipsEndpoint ?? (0, configLoader.Z)(NodeUseFipsEndpointConfigOptions.Ko, loaderConfig),
                userAgentAppId: config?.userAgentAppId ?? (0, configLoader.Z)(nodeAppIdConfigOptions.hV, loaderConfig)
            };
        };
        var dist_es_extensions = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+region-config-resolver@3.972.10/node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js");
        var httpExtensionConfiguration = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@5.3.12/node_modules/@smithy/protocol-http/dist-es/extensions/httpExtensionConfiguration.js");
        var defaultExtensionConfiguration = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js");
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
        const resolveRuntimeExtensions = (runtimeConfig, extensions)=>{
            const extensionConfiguration = Object.assign((0, dist_es_extensions.R)(runtimeConfig), (0, defaultExtensionConfiguration.xA)(runtimeConfig), (0, httpExtensionConfiguration.e)(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
            extensions.forEach((extension)=>extension.configure(extensionConfiguration));
            return Object.assign(runtimeConfig, (0, dist_es_extensions.$)(extensionConfiguration), (0, defaultExtensionConfiguration.uv)(extensionConfiguration), (0, httpExtensionConfiguration.j)(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
        };
        class SSOOIDCClient extends client.K {
            config;
            constructor(...[configuration]){
                const _config_0 = runtimeConfig_getRuntimeConfig(configuration || {});
                super(_config_0);
                this.initConfig = _config_0;
                const _config_1 = resolveClientEndpointParameters(_config_0);
                const _config_2 = (0, configurations.D)(_config_1);
                const _config_3 = (0, dist_es_configurations.$z)(_config_2);
                const _config_4 = (0, resolveRegionConfig.T)(_config_3);
                const _config_5 = (0, dist_es.OV)(_config_4);
                const _config_6 = (0, resolveEndpointConfig.C)(_config_5);
                const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
                const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
                this.config = _config_8;
                this.middlewareStack.use((0, getSchemaSerdePlugin.wq)(this.config));
                this.middlewareStack.use((0, user_agent_middleware.sM)(this.config));
                this.middlewareStack.use((0, retryMiddleware.ey)(this.config));
                this.middlewareStack.use((0, middleware_content_length_dist_es.vK)(this.config));
                this.middlewareStack.use((0, dist_es.TC)(this.config));
                this.middlewareStack.use((0, loggerMiddleware.Y7)(this.config));
                this.middlewareStack.use((0, getRecursionDetectionPlugin.n)(this.config));
                this.middlewareStack.use((0, getHttpAuthSchemeEndpointRuleSetPlugin.w)(this.config, {
                    httpAuthSchemeParametersProvider: defaultSSOOIDCHttpAuthSchemeParametersProvider,
                    identityProviderConfigProvider: async (config)=>new DefaultIdentityProviderConfig.h({
                            "aws.auth#sigv4": config.credentials
                        })
                }));
                this.middlewareStack.use((0, getHttpSigningMiddleware.l)(this.config));
            }
            destroy() {
                super.destroy();
            }
        }
        var getEndpointPlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@4.4.28/node_modules/@smithy/middleware-endpoint/dist-es/getEndpointPlugin.js");
        var command = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/command.js");
        class CreateTokenCommand extends command.u.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
            return [
                (0, getEndpointPlugin.r)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSSOOIDCService", "CreateToken", {}).n("SSOOIDCClient", "CreateTokenCommand").sc(CreateToken$).build() {
        }
    }
};
