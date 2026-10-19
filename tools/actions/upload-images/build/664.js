"use strict";
exports.ids = [
    664
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            GetRoleCredentialsCommand: ()=>GetRoleCredentialsCommand,
            SSOClient: ()=>SSOClient
        });
        var getEndpointPlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@4.4.28/node_modules/@smithy/middleware-endpoint/dist-es/getEndpointPlugin.js");
        var command = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/command.js");
        const resolveClientEndpointParameters = (options)=>Object.assign(options, {
                useDualstackEndpoint: options.useDualstackEndpoint ?? false,
                useFipsEndpoint: options.useFipsEndpoint ?? false,
                defaultSigningName: "awsssoportal"
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
        var TypeRegistry = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js");
        var exceptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/exceptions.js");
        class SSOServiceException extends exceptions.T {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, SSOServiceException.prototype);
            }
        }
        class InvalidRequestException extends SSOServiceException {
            name = "InvalidRequestException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "InvalidRequestException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidRequestException.prototype);
            }
        }
        class ResourceNotFoundException extends SSOServiceException {
            name = "ResourceNotFoundException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "ResourceNotFoundException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
            }
        }
        class TooManyRequestsException extends SSOServiceException {
            name = "TooManyRequestsException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "TooManyRequestsException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, TooManyRequestsException.prototype);
            }
        }
        class UnauthorizedException extends SSOServiceException {
            name = "UnauthorizedException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "UnauthorizedException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, UnauthorizedException.prototype);
            }
        }
        const _ATT = "AccessTokenType";
        const _GRC = "GetRoleCredentials";
        const _GRCR = "GetRoleCredentialsRequest";
        const _GRCRe = "GetRoleCredentialsResponse";
        const _IRE = "InvalidRequestException";
        const _RC = "RoleCredentials";
        const _RNFE = "ResourceNotFoundException";
        const _SAKT = "SecretAccessKeyType";
        const _STT = "SessionTokenType";
        const _TMRE = "TooManyRequestsException";
        const _UE = "UnauthorizedException";
        const _aI = "accountId";
        const _aKI = "accessKeyId";
        const _aT = "accessToken";
        const _ai = "account_id";
        const _c = "client";
        const _e = "error";
        const _ex = "expiration";
        const _h = "http";
        const _hE = "httpError";
        const _hH = "httpHeader";
        const _hQ = "httpQuery";
        const _m = "message";
        const _rC = "roleCredentials";
        const _rN = "roleName";
        const _rn = "role_name";
        const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sso";
        const _sAK = "secretAccessKey";
        const _sT = "sessionToken";
        const _xasbt = "x-amz-sso_bearer_token";
        const n0 = "com.amazonaws.sso";
        const _s_registry = TypeRegistry.O["for"](_s);
        var SSOServiceException$ = [
            -3,
            _s,
            "SSOServiceException",
            0,
            [],
            []
        ];
        _s_registry.registerError(SSOServiceException$, SSOServiceException);
        const n0_registry = TypeRegistry.O["for"](n0);
        var InvalidRequestException$ = [
            -3,
            n0,
            _IRE,
            {
                [_e]: _c,
                [_hE]: 400
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(InvalidRequestException$, InvalidRequestException);
        var ResourceNotFoundException$ = [
            -3,
            n0,
            _RNFE,
            {
                [_e]: _c,
                [_hE]: 404
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(ResourceNotFoundException$, ResourceNotFoundException);
        var TooManyRequestsException$ = [
            -3,
            n0,
            _TMRE,
            {
                [_e]: _c,
                [_hE]: 429
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(TooManyRequestsException$, TooManyRequestsException);
        var UnauthorizedException$ = [
            -3,
            n0,
            _UE,
            {
                [_e]: _c,
                [_hE]: 401
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(UnauthorizedException$, UnauthorizedException);
        const errorTypeRegistries = [
            _s_registry,
            n0_registry
        ];
        var AccessTokenType = [
            0,
            n0,
            _ATT,
            8,
            0
        ];
        var SecretAccessKeyType = [
            0,
            n0,
            _SAKT,
            8,
            0
        ];
        var SessionTokenType = [
            0,
            n0,
            _STT,
            8,
            0
        ];
        var GetRoleCredentialsRequest$ = [
            3,
            n0,
            _GRCR,
            0,
            [
                _rN,
                _aI,
                _aT
            ],
            [
                [
                    0,
                    {
                        [_hQ]: _rn
                    }
                ],
                [
                    0,
                    {
                        [_hQ]: _ai
                    }
                ],
                [
                    ()=>AccessTokenType,
                    {
                        [_hH]: _xasbt
                    }
                ]
            ],
            3
        ];
        var GetRoleCredentialsResponse$ = [
            3,
            n0,
            _GRCRe,
            0,
            [
                _rC
            ],
            [
                [
                    ()=>RoleCredentials$,
                    0
                ]
            ]
        ];
        var RoleCredentials$ = [
            3,
            n0,
            _RC,
            0,
            [
                _aKI,
                _sAK,
                _sT,
                _ex
            ],
            [
                0,
                [
                    ()=>SecretAccessKeyType,
                    0
                ],
                [
                    ()=>SessionTokenType,
                    0
                ],
                1
            ]
        ];
        var GetRoleCredentials$ = [
            9,
            n0,
            _GRC,
            {
                [_h]: [
                    "GET",
                    "/federation/credentials",
                    200
                ]
            },
            ()=>GetRoleCredentialsRequest$,
            ()=>GetRoleCredentialsResponse$
        ];
        class GetRoleCredentialsCommand extends command.u.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
            return [
                (0, getEndpointPlugin.r)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("SWBPortalService", "GetRoleCredentials", {}).n("SSOClient", "GetRoleCredentialsCommand").sc(GetRoleCredentials$).build() {
        }
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
        const defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, getSmithyContext.u)(context).operation,
                region: await (0, normalizeProvider.t)(config.region)() || (()=>{
                    throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
                })()
            });
        function createAwsAuthSigv4HttpAuthOption(authParameters) {
            return {
                schemeId: "aws.auth#sigv4",
                signingProperties: {
                    name: "awsssoportal",
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
        const defaultSSOHttpAuthSchemeProvider = (authParameters)=>{
            const options = [];
            switch(authParameters.operation){
                case "GetRoleCredentials":
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
                                                        url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
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
                                                        url: "https://portal.sso.{Region}.amazonaws.com",
                                                        properties: n,
                                                        headers: n
                                                    },
                                                    type: e
                                                },
                                                {
                                                    endpoint: {
                                                        url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}",
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
                                                        url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}",
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
                                        url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}",
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
        const getRuntimeConfig = (config)=>({
                apiVersion: "2019-06-10",
                base64Decoder: config?.base64Decoder ?? fromBase64.E,
                base64Encoder: config?.base64Encoder ?? toBase64.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOHttpAuthSchemeProvider,
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
                    defaultNamespace: "com.amazonaws.sso",
                    errorTypeRegistries: errorTypeRegistries,
                    version: "2019-06-10",
                    serviceTarget: "SWBPortalService"
                },
                serviceId: config?.serviceId ?? "SSO",
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
        class SSOClient extends client.K {
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
                    httpAuthSchemeParametersProvider: defaultSSOHttpAuthSchemeParametersProvider,
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
    }
};
