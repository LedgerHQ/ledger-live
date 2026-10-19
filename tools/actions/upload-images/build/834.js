"use strict";
exports.ids = [
    834
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/signin/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            CreateOAuth2TokenCommand: ()=>CreateOAuth2TokenCommand,
            SigninClient: ()=>SigninClient
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
        const defaultSigninHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, getSmithyContext.u)(context).operation,
                region: await (0, normalizeProvider.t)(config.region)() || (()=>{
                    throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
                })()
            });
        function createAwsAuthSigv4HttpAuthOption(authParameters) {
            return {
                schemeId: "aws.auth#sigv4",
                signingProperties: {
                    name: "signin",
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
        const defaultSigninHttpAuthSchemeProvider = (authParameters)=>{
            const options = [];
            switch(authParameters.operation){
                case "CreateOAuth2Token":
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
                defaultSigningName: "signin"
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
        const a = true, b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "stringEquals", i = {
            [u]: true,
            default: false,
            type: "boolean"
        }, j = {
            [u]: false,
            type: "string"
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
            [v]: "getAttr",
            [w]: [
                {
                    [x]: g
                },
                "name"
            ]
        }, p = {
            [v]: c,
            [w]: [
                {
                    [x]: "UseFIPS"
                },
                false
            ]
        }, q = {
            [v]: c,
            [w]: [
                {
                    [x]: "UseDualStack"
                },
                false
            ]
        }, r = {
            [v]: "getAttr",
            [w]: [
                {
                    [x]: g
                },
                "supportsFIPS"
            ]
        }, s = {
            [v]: c,
            [w]: [
                true,
                {
                    [v]: "getAttr",
                    [w]: [
                        {
                            [x]: g
                        },
                        "supportsDualStack"
                    ]
                }
            ]
        }, t = [
            {
                [x]: "Region"
            }
        ];
        const _data = {
            version: "1.0",
            parameters: {
                UseDualStack: i,
                UseFIPS: i,
                Endpoint: j,
                Region: j
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
                            conditions: [
                                l
                            ],
                            error: "Invalid Configuration: FIPS and custom endpoint are not supported",
                            type: d
                        },
                        {
                            rules: [
                                {
                                    conditions: [
                                        m
                                    ],
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
                        }
                    ],
                    type: f
                },
                {
                    rules: [
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
                                                {
                                                    [v]: h,
                                                    [w]: [
                                                        ruleset_o,
                                                        "aws"
                                                    ]
                                                },
                                                p,
                                                q
                                            ],
                                            endpoint: {
                                                url: "https://{Region}.signin.aws.amazon.com",
                                                properties: n,
                                                headers: n
                                            },
                                            type: e
                                        },
                                        {
                                            conditions: [
                                                {
                                                    [v]: h,
                                                    [w]: [
                                                        ruleset_o,
                                                        "aws-cn"
                                                    ]
                                                },
                                                p,
                                                q
                                            ],
                                            endpoint: {
                                                url: "https://{Region}.signin.amazonaws.cn",
                                                properties: n,
                                                headers: n
                                            },
                                            type: e
                                        },
                                        {
                                            conditions: [
                                                {
                                                    [v]: h,
                                                    [w]: [
                                                        ruleset_o,
                                                        "aws-us-gov"
                                                    ]
                                                },
                                                p,
                                                q
                                            ],
                                            endpoint: {
                                                url: "https://{Region}.signin.amazonaws-us-gov.com",
                                                properties: n,
                                                headers: n
                                            },
                                            type: e
                                        },
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
                                                                r
                                                            ]
                                                        },
                                                        s
                                                    ],
                                                    rules: [
                                                        {
                                                            endpoint: {
                                                                url: "https://signin-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
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
                                            conditions: [
                                                l,
                                                q
                                            ],
                                            rules: [
                                                {
                                                    conditions: [
                                                        {
                                                            [v]: c,
                                                            [w]: [
                                                                r,
                                                                a
                                                            ]
                                                        }
                                                    ],
                                                    rules: [
                                                        {
                                                            endpoint: {
                                                                url: "https://signin-fips.{Region}.{PartitionResult#dnsSuffix}",
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
                                            conditions: [
                                                p,
                                                m
                                            ],
                                            rules: [
                                                {
                                                    conditions: [
                                                        s
                                                    ],
                                                    rules: [
                                                        {
                                                            endpoint: {
                                                                url: "https://signin.{Region}.{PartitionResult#dualStackDnsSuffix}",
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
                                                url: "https://signin.{Region}.{PartitionResult#dnsSuffix}",
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
                    ],
                    type: f
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
        class SigninServiceException extends exceptions.T {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, SigninServiceException.prototype);
            }
        }
        class AccessDeniedException extends SigninServiceException {
            name = "AccessDeniedException";
            $fault = "client";
            error;
            constructor(opts){
                super({
                    name: "AccessDeniedException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, AccessDeniedException.prototype);
                this.error = opts.error;
            }
        }
        class InternalServerException extends SigninServiceException {
            name = "InternalServerException";
            $fault = "server";
            error;
            constructor(opts){
                super({
                    name: "InternalServerException",
                    $fault: "server",
                    ...opts
                });
                Object.setPrototypeOf(this, InternalServerException.prototype);
                this.error = opts.error;
            }
        }
        class TooManyRequestsError extends SigninServiceException {
            name = "TooManyRequestsError";
            $fault = "client";
            error;
            constructor(opts){
                super({
                    name: "TooManyRequestsError",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, TooManyRequestsError.prototype);
                this.error = opts.error;
            }
        }
        class ValidationException extends SigninServiceException {
            name = "ValidationException";
            $fault = "client";
            error;
            constructor(opts){
                super({
                    name: "ValidationException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, ValidationException.prototype);
                this.error = opts.error;
            }
        }
        const _ADE = "AccessDeniedException";
        const _AT = "AccessToken";
        const _COAT = "CreateOAuth2Token";
        const _COATR = "CreateOAuth2TokenRequest";
        const _COATRB = "CreateOAuth2TokenRequestBody";
        const _COATRBr = "CreateOAuth2TokenResponseBody";
        const _COATRr = "CreateOAuth2TokenResponse";
        const _ISE = "InternalServerException";
        const _RT = "RefreshToken";
        const _TMRE = "TooManyRequestsError";
        const _VE = "ValidationException";
        const _aKI = "accessKeyId";
        const _aT = "accessToken";
        const _c = "client";
        const _cI = "clientId";
        const _cV = "codeVerifier";
        const _co = "code";
        const _e = "error";
        const _eI = "expiresIn";
        const _gT = "grantType";
        const _h = "http";
        const _hE = "httpError";
        const _iT = "idToken";
        const _jN = "jsonName";
        const _m = "message";
        const _rT = "refreshToken";
        const _rU = "redirectUri";
        const _s = "smithy.ts.sdk.synthetic.com.amazonaws.signin";
        const _sAK = "secretAccessKey";
        const _sT = "sessionToken";
        const _se = "server";
        const _tI = "tokenInput";
        const _tO = "tokenOutput";
        const _tT = "tokenType";
        const n0 = "com.amazonaws.signin";
        const _s_registry = TypeRegistry.O["for"](_s);
        var SigninServiceException$ = [
            -3,
            _s,
            "SigninServiceException",
            0,
            [],
            []
        ];
        _s_registry.registerError(SigninServiceException$, SigninServiceException);
        const n0_registry = TypeRegistry.O["for"](n0);
        var AccessDeniedException$ = [
            -3,
            n0,
            _ADE,
            {
                [_e]: _c
            },
            [
                _e,
                _m
            ],
            [
                0,
                0
            ],
            2
        ];
        n0_registry.registerError(AccessDeniedException$, AccessDeniedException);
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
                _m
            ],
            [
                0,
                0
            ],
            2
        ];
        n0_registry.registerError(InternalServerException$, InternalServerException);
        var TooManyRequestsError$ = [
            -3,
            n0,
            _TMRE,
            {
                [_e]: _c,
                [_hE]: 429
            },
            [
                _e,
                _m
            ],
            [
                0,
                0
            ],
            2
        ];
        n0_registry.registerError(TooManyRequestsError$, TooManyRequestsError);
        var ValidationException$ = [
            -3,
            n0,
            _VE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _e,
                _m
            ],
            [
                0,
                0
            ],
            2
        ];
        n0_registry.registerError(ValidationException$, ValidationException);
        const errorTypeRegistries = [
            _s_registry,
            n0_registry
        ];
        var RefreshToken = [
            0,
            n0,
            _RT,
            8,
            0
        ];
        var AccessToken$ = [
            3,
            n0,
            _AT,
            8,
            [
                _aKI,
                _sAK,
                _sT
            ],
            [
                [
                    0,
                    {
                        [_jN]: _aKI
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _sAK
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _sT
                    }
                ]
            ],
            3
        ];
        var CreateOAuth2TokenRequest$ = [
            3,
            n0,
            _COATR,
            0,
            [
                _tI
            ],
            [
                [
                    ()=>CreateOAuth2TokenRequestBody$,
                    16
                ]
            ],
            1
        ];
        var CreateOAuth2TokenRequestBody$ = [
            3,
            n0,
            _COATRB,
            0,
            [
                _cI,
                _gT,
                _co,
                _rU,
                _cV,
                _rT
            ],
            [
                [
                    0,
                    {
                        [_jN]: _cI
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _gT
                    }
                ],
                0,
                [
                    0,
                    {
                        [_jN]: _rU
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _cV
                    }
                ],
                [
                    ()=>RefreshToken,
                    {
                        [_jN]: _rT
                    }
                ]
            ],
            2
        ];
        var CreateOAuth2TokenResponse$ = [
            3,
            n0,
            _COATRr,
            0,
            [
                _tO
            ],
            [
                [
                    ()=>CreateOAuth2TokenResponseBody$,
                    16
                ]
            ],
            1
        ];
        var CreateOAuth2TokenResponseBody$ = [
            3,
            n0,
            _COATRBr,
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
                    ()=>AccessToken$,
                    {
                        [_jN]: _aT
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _tT
                    }
                ],
                [
                    1,
                    {
                        [_jN]: _eI
                    }
                ],
                [
                    ()=>RefreshToken,
                    {
                        [_jN]: _rT
                    }
                ],
                [
                    0,
                    {
                        [_jN]: _iT
                    }
                ]
            ],
            4
        ];
        var CreateOAuth2Token$ = [
            9,
            n0,
            _COAT,
            {
                [_h]: [
                    "POST",
                    "/v1/token",
                    200
                ]
            },
            ()=>CreateOAuth2TokenRequest$,
            ()=>CreateOAuth2TokenResponse$
        ];
        const getRuntimeConfig = (config)=>({
                apiVersion: "2023-01-01",
                base64Decoder: config?.base64Decoder ?? fromBase64.E,
                base64Encoder: config?.base64Encoder ?? toBase64.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSigninHttpAuthSchemeProvider,
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
                    defaultNamespace: "com.amazonaws.signin",
                    errorTypeRegistries: errorTypeRegistries,
                    version: "2023-01-01",
                    serviceTarget: "Signin"
                },
                serviceId: config?.serviceId ?? "Signin",
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
        class SigninClient extends client.K {
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
                    httpAuthSchemeParametersProvider: defaultSigninHttpAuthSchemeParametersProvider,
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
        class CreateOAuth2TokenCommand extends command.u.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
            return [
                (0, getEndpointPlugin.r)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("Signin", "CreateOAuth2Token", {}).n("SigninClient", "CreateOAuth2TokenCommand").sc(CreateOAuth2Token$).build() {
        }
    }
};
