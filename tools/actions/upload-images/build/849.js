"use strict";
exports.ids = [
    849
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sts/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            getDefaultRoleAssumer: ()=>defaultRoleAssumers_getDefaultRoleAssumer,
            getDefaultRoleAssumerWithWebIdentity: ()=>defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity
        });
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        var regionConfig_config = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js");
        var configLoader = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@4.3.12/node_modules/@smithy/node-config-provider/dist-es/configLoader.js");
        function stsRegionDefaultResolver(loaderConfig = {}) {
            return (0, configLoader.Z)({
                ...regionConfig_config.GG,
                async default () {
                    if (!warning.silence) console.warn("@aws-sdk - WARN - default STS region of us-east-1 used. See @aws-sdk/credential-providers README and set a region explicitly.");
                    return "us-east-1";
                }
            }, {
                ...regionConfig_config.zH,
                ...loaderConfig
            });
        }
        const warning = {
            silence: false
        };
        var getEndpointPlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@4.4.28/node_modules/@smithy/middleware-endpoint/dist-es/getEndpointPlugin.js");
        var command = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/command.js");
        const resolveClientEndpointParameters = (options)=>Object.assign(options, {
                useDualstackEndpoint: options.useDualstackEndpoint ?? false,
                useFipsEndpoint: options.useFipsEndpoint ?? false,
                useGlobalEndpoint: options.useGlobalEndpoint ?? false,
                defaultSigningName: "sts"
            });
        const commonParams = {
            UseGlobalEndpoint: {
                type: "builtInParams",
                name: "useGlobalEndpoint"
            },
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
        class STSServiceException extends exceptions.T {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, STSServiceException.prototype);
            }
        }
        class ExpiredTokenException extends STSServiceException {
            name = "ExpiredTokenException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "ExpiredTokenException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, ExpiredTokenException.prototype);
            }
        }
        class MalformedPolicyDocumentException extends STSServiceException {
            name = "MalformedPolicyDocumentException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "MalformedPolicyDocumentException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
            }
        }
        class PackedPolicyTooLargeException extends STSServiceException {
            name = "PackedPolicyTooLargeException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "PackedPolicyTooLargeException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
            }
        }
        class RegionDisabledException extends STSServiceException {
            name = "RegionDisabledException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "RegionDisabledException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, RegionDisabledException.prototype);
            }
        }
        class IDPRejectedClaimException extends STSServiceException {
            name = "IDPRejectedClaimException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "IDPRejectedClaimException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
            }
        }
        class InvalidIdentityTokenException extends STSServiceException {
            name = "InvalidIdentityTokenException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "InvalidIdentityTokenException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
            }
        }
        class IDPCommunicationErrorException extends STSServiceException {
            name = "IDPCommunicationErrorException";
            $fault = "client";
            constructor(opts){
                super({
                    name: "IDPCommunicationErrorException",
                    $fault: "client",
                    ...opts
                });
                Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
            }
        }
        const _A = "Arn";
        const _AKI = "AccessKeyId";
        const _AR = "AssumeRole";
        const _ARI = "AssumedRoleId";
        const _ARR = "AssumeRoleRequest";
        const _ARRs = "AssumeRoleResponse";
        const _ARU = "AssumedRoleUser";
        const _ARWWI = "AssumeRoleWithWebIdentity";
        const _ARWWIR = "AssumeRoleWithWebIdentityRequest";
        const _ARWWIRs = "AssumeRoleWithWebIdentityResponse";
        const _Au = "Audience";
        const _C = "Credentials";
        const _CA = "ContextAssertion";
        const _DS = "DurationSeconds";
        const _E = "Expiration";
        const _EI = "ExternalId";
        const _ETE = "ExpiredTokenException";
        const _IDPCEE = "IDPCommunicationErrorException";
        const _IDPRCE = "IDPRejectedClaimException";
        const _IITE = "InvalidIdentityTokenException";
        const _K = "Key";
        const _MPDE = "MalformedPolicyDocumentException";
        const _P = "Policy";
        const _PA = "PolicyArns";
        const _PAr = "ProviderArn";
        const _PC = "ProvidedContexts";
        const _PCLT = "ProvidedContextsListType";
        const _PCr = "ProvidedContext";
        const _PDT = "PolicyDescriptorType";
        const _PI = "ProviderId";
        const _PPS = "PackedPolicySize";
        const _PPTLE = "PackedPolicyTooLargeException";
        const _Pr = "Provider";
        const _RA = "RoleArn";
        const _RDE = "RegionDisabledException";
        const _RSN = "RoleSessionName";
        const _SAK = "SecretAccessKey";
        const _SFWIT = "SubjectFromWebIdentityToken";
        const _SI = "SourceIdentity";
        const _SN = "SerialNumber";
        const _ST = "SessionToken";
        const _T = "Tags";
        const _TC = "TokenCode";
        const _TTK = "TransitiveTagKeys";
        const _Ta = "Tag";
        const _V = "Value";
        const _WIT = "WebIdentityToken";
        const _a = "arn";
        const _aKST = "accessKeySecretType";
        const _aQE = "awsQueryError";
        const _c = "client";
        const _cTT = "clientTokenType";
        const _e = "error";
        const _hE = "httpError";
        const _m = "message";
        const _pDLT = "policyDescriptorListType";
        const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sts";
        const _tLT = "tagListType";
        const n0 = "com.amazonaws.sts";
        const _s_registry = TypeRegistry.O["for"](_s);
        var STSServiceException$ = [
            -3,
            _s,
            "STSServiceException",
            0,
            [],
            []
        ];
        _s_registry.registerError(STSServiceException$, STSServiceException);
        const n0_registry = TypeRegistry.O["for"](n0);
        var ExpiredTokenException$ = [
            -3,
            n0,
            _ETE,
            {
                [_aQE]: [
                    "ExpiredTokenException",
                    400
                ],
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
        n0_registry.registerError(ExpiredTokenException$, ExpiredTokenException);
        var IDPCommunicationErrorException$ = [
            -3,
            n0,
            _IDPCEE,
            {
                [_aQE]: [
                    "IDPCommunicationError",
                    400
                ],
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
        n0_registry.registerError(IDPCommunicationErrorException$, IDPCommunicationErrorException);
        var IDPRejectedClaimException$ = [
            -3,
            n0,
            _IDPRCE,
            {
                [_aQE]: [
                    "IDPRejectedClaim",
                    403
                ],
                [_e]: _c,
                [_hE]: 403
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(IDPRejectedClaimException$, IDPRejectedClaimException);
        var InvalidIdentityTokenException$ = [
            -3,
            n0,
            _IITE,
            {
                [_aQE]: [
                    "InvalidIdentityToken",
                    400
                ],
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
        n0_registry.registerError(InvalidIdentityTokenException$, InvalidIdentityTokenException);
        var MalformedPolicyDocumentException$ = [
            -3,
            n0,
            _MPDE,
            {
                [_aQE]: [
                    "MalformedPolicyDocument",
                    400
                ],
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
        n0_registry.registerError(MalformedPolicyDocumentException$, MalformedPolicyDocumentException);
        var PackedPolicyTooLargeException$ = [
            -3,
            n0,
            _PPTLE,
            {
                [_aQE]: [
                    "PackedPolicyTooLarge",
                    400
                ],
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
        n0_registry.registerError(PackedPolicyTooLargeException$, PackedPolicyTooLargeException);
        var RegionDisabledException$ = [
            -3,
            n0,
            _RDE,
            {
                [_aQE]: [
                    "RegionDisabledException",
                    403
                ],
                [_e]: _c,
                [_hE]: 403
            },
            [
                _m
            ],
            [
                0
            ]
        ];
        n0_registry.registerError(RegionDisabledException$, RegionDisabledException);
        const errorTypeRegistries = [
            _s_registry,
            n0_registry
        ];
        var accessKeySecretType = [
            0,
            n0,
            _aKST,
            8,
            0
        ];
        var clientTokenType = [
            0,
            n0,
            _cTT,
            8,
            0
        ];
        var AssumedRoleUser$ = [
            3,
            n0,
            _ARU,
            0,
            [
                _ARI,
                _A
            ],
            [
                0,
                0
            ],
            2
        ];
        var AssumeRoleRequest$ = [
            3,
            n0,
            _ARR,
            0,
            [
                _RA,
                _RSN,
                _PA,
                _P,
                _DS,
                _T,
                _TTK,
                _EI,
                _SN,
                _TC,
                _SI,
                _PC
            ],
            [
                0,
                0,
                ()=>policyDescriptorListType,
                0,
                1,
                ()=>tagListType,
                64,
                0,
                0,
                0,
                0,
                ()=>ProvidedContextsListType
            ],
            2
        ];
        var AssumeRoleResponse$ = [
            3,
            n0,
            _ARRs,
            0,
            [
                _C,
                _ARU,
                _PPS,
                _SI
            ],
            [
                [
                    ()=>Credentials$,
                    0
                ],
                ()=>AssumedRoleUser$,
                1,
                0
            ]
        ];
        var AssumeRoleWithWebIdentityRequest$ = [
            3,
            n0,
            _ARWWIR,
            0,
            [
                _RA,
                _RSN,
                _WIT,
                _PI,
                _PA,
                _P,
                _DS
            ],
            [
                0,
                0,
                [
                    ()=>clientTokenType,
                    0
                ],
                0,
                ()=>policyDescriptorListType,
                0,
                1
            ],
            3
        ];
        var AssumeRoleWithWebIdentityResponse$ = [
            3,
            n0,
            _ARWWIRs,
            0,
            [
                _C,
                _SFWIT,
                _ARU,
                _PPS,
                _Pr,
                _Au,
                _SI
            ],
            [
                [
                    ()=>Credentials$,
                    0
                ],
                0,
                ()=>AssumedRoleUser$,
                1,
                0,
                0,
                0
            ]
        ];
        var Credentials$ = [
            3,
            n0,
            _C,
            0,
            [
                _AKI,
                _SAK,
                _ST,
                _E
            ],
            [
                0,
                [
                    ()=>accessKeySecretType,
                    0
                ],
                0,
                4
            ],
            4
        ];
        var PolicyDescriptorType$ = [
            3,
            n0,
            _PDT,
            0,
            [
                _a
            ],
            [
                0
            ]
        ];
        var ProvidedContext$ = [
            3,
            n0,
            _PCr,
            0,
            [
                _PAr,
                _CA
            ],
            [
                0,
                0
            ]
        ];
        var Tag$ = [
            3,
            n0,
            _Ta,
            0,
            [
                _K,
                _V
            ],
            [
                0,
                0
            ],
            2
        ];
        var policyDescriptorListType = [
            1,
            n0,
            _pDLT,
            0,
            ()=>PolicyDescriptorType$
        ];
        var ProvidedContextsListType = [
            1,
            n0,
            _PCLT,
            0,
            ()=>ProvidedContext$
        ];
        var tagListType = [
            1,
            n0,
            _tLT,
            0,
            ()=>Tag$
        ];
        var AssumeRole$ = [
            9,
            n0,
            _AR,
            0,
            ()=>AssumeRoleRequest$,
            ()=>AssumeRoleResponse$
        ];
        var AssumeRoleWithWebIdentity$ = [
            9,
            n0,
            _ARWWI,
            0,
            ()=>AssumeRoleWithWebIdentityRequest$,
            ()=>AssumeRoleWithWebIdentityResponse$
        ];
        class AssumeRoleCommand extends command.u.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
            return [
                (0, getEndpointPlugin.r)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSecurityTokenServiceV20110615", "AssumeRole", {}).n("STSClient", "AssumeRoleCommand").sc(AssumeRole$).build() {
        }
        class AssumeRoleWithWebIdentityCommand extends command.u.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
            return [
                (0, getEndpointPlugin.r)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {}).n("STSClient", "AssumeRoleWithWebIdentityCommand").sc(AssumeRoleWithWebIdentity$).build() {
        }
        const getAccountIdFromAssumedRoleUser = (assumedRoleUser)=>{
            if ("string" == typeof assumedRoleUser?.Arn) {
                const arnComponents = assumedRoleUser.Arn.split(":");
                if (arnComponents.length > 4 && "" !== arnComponents[4]) return arnComponents[4];
            }
        };
        const resolveRegion = async (_region, _parentRegion, credentialProviderLogger, loaderConfig = {})=>{
            const region = "function" == typeof _region ? await _region() : _region;
            const parentRegion = "function" == typeof _parentRegion ? await _parentRegion() : _parentRegion;
            let stsDefaultRegion = "";
            const resolvedRegion = region ?? parentRegion ?? (stsDefaultRegion = await stsRegionDefaultResolver(loaderConfig)());
            credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (credential provider clientConfig)`, `${parentRegion} (contextual client)`, `${stsDefaultRegion} (STS default: AWS_REGION, profile region, or us-east-1)`);
            return resolvedRegion;
        };
        const getDefaultRoleAssumer = (stsOptions, STSClient)=>{
            let stsClient;
            let closureSourceCreds;
            return async (sourceCreds, params)=>{
                closureSourceCreds = sourceCreds;
                if (!stsClient) {
                    const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId } = stsOptions;
                    const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
                        logger,
                        profile
                    });
                    const isCompatibleRequestHandler = !isH2(requestHandler);
                    stsClient = new STSClient({
                        ...stsOptions,
                        userAgentAppId,
                        profile,
                        credentialDefaultProvider: ()=>async ()=>closureSourceCreds,
                        region: resolvedRegion,
                        requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
                        logger: logger
                    });
                }
                const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleCommand(params));
                if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
                const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
                const credentials = {
                    accessKeyId: Credentials.AccessKeyId,
                    secretAccessKey: Credentials.SecretAccessKey,
                    sessionToken: Credentials.SessionToken,
                    expiration: Credentials.Expiration,
                    ...Credentials.CredentialScope && {
                        credentialScope: Credentials.CredentialScope
                    },
                    ...accountId && {
                        accountId
                    }
                };
                (0, setCredentialFeature.g)(credentials, "CREDENTIALS_STS_ASSUME_ROLE", "i");
                return credentials;
            };
        };
        const getDefaultRoleAssumerWithWebIdentity = (stsOptions, STSClient)=>{
            let stsClient;
            return async (params)=>{
                if (!stsClient) {
                    const { logger = stsOptions?.parentClientConfig?.logger, profile = stsOptions?.parentClientConfig?.profile, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, userAgentAppId = stsOptions?.parentClientConfig?.userAgentAppId } = stsOptions;
                    const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger, {
                        logger,
                        profile
                    });
                    const isCompatibleRequestHandler = !isH2(requestHandler);
                    stsClient = new STSClient({
                        ...stsOptions,
                        userAgentAppId,
                        profile,
                        region: resolvedRegion,
                        requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
                        logger: logger
                    });
                }
                const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
                if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
                const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
                const credentials = {
                    accessKeyId: Credentials.AccessKeyId,
                    secretAccessKey: Credentials.SecretAccessKey,
                    sessionToken: Credentials.SessionToken,
                    expiration: Credentials.Expiration,
                    ...Credentials.CredentialScope && {
                        credentialScope: Credentials.CredentialScope
                    },
                    ...accountId && {
                        accountId
                    }
                };
                if (accountId) (0, setCredentialFeature.g)(credentials, "RESOLVED_ACCOUNT_ID", "T");
                (0, setCredentialFeature.g)(credentials, "CREDENTIALS_STS_ASSUME_ROLE_WEB_ID", "k");
                return credentials;
            };
        };
        const isH2 = (requestHandler)=>requestHandler?.metadata?.handlerProtocol === "h2";
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
        const defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, getSmithyContext.u)(context).operation,
                region: await (0, normalizeProvider.t)(config.region)() || (()=>{
                    throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
                })()
            });
        function createAwsAuthSigv4HttpAuthOption(authParameters) {
            return {
                schemeId: "aws.auth#sigv4",
                signingProperties: {
                    name: "sts",
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
        const defaultSTSHttpAuthSchemeProvider = (authParameters)=>{
            const options = [];
            switch(authParameters.operation){
                case "AssumeRoleWithWebIdentity":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                default:
                    options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
            }
            return options;
        };
        const resolveStsAuthConfig = (input)=>Object.assign(input, {
                stsClientCtor: STSClient_STSClient
            });
        const resolveHttpAuthSchemeConfig = (config)=>{
            const config_0 = resolveStsAuthConfig(config);
            const config_1 = (0, resolveAwsSdkSigV4Config.h)(config_0);
            return Object.assign(config_1, {
                authSchemePreference: (0, normalizeProvider.t)(config.authSchemePreference ?? [])
            });
        };
        var nested_clients_package = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/package.json");
        var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
        var NODE_AUTH_SCHEME_PREFERENCE_OPTIONS = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.js");
        var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
        var defaultUserAgent = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.973.13/node_modules/@aws-sdk/util-user-agent-node/dist-es/defaultUserAgent.js");
        var nodeAppIdConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.973.13/node_modules/@aws-sdk/util-user-agent-node/dist-es/nodeAppIdConfigOptions.js");
        var NodeUseDualstackEndpointConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js");
        var NodeUseFipsEndpointConfigOptions = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@4.4.13/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js");
        var noAuth = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js");
        var hash_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+hash-node@4.2.12/node_modules/@smithy/hash-node/dist-es/index.js");
        var node_http_handler = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@4.5.1/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
        var stream_collector = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@4.5.1/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js");
        var dist_es_emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js");
        var defaults_mode = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js");
        var calculateBodyLength = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-body-length-node@4.2.3/node_modules/@smithy/util-body-length-node/dist-es/calculateBodyLength.js");
        var resolveDefaultsModeConfig = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@4.2.48/node_modules/@smithy/util-defaults-mode-node/dist-es/resolveDefaultsModeConfig.js");
        var dist_es_config = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-retry@4.2.12/node_modules/@smithy/util-retry/dist-es/config.js");
        var NormalizedSchema = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js");
        var httpRequest = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@5.3.12/node_modules/@smithy/protocol-http/dist-es/httpRequest.js");
        var collect_stream_body = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/collect-stream-body.js");
        var HttpProtocol = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/HttpProtocol.js");
        class RpcProtocol extends HttpProtocol.t {
            async serializeRequest(operationSchema, _input, context) {
                const serializer = this.serializer;
                const query = {};
                const headers = {};
                const endpoint = await context.endpoint();
                const ns = NormalizedSchema.l1.of(operationSchema?.input);
                const schema = ns.getSchema();
                let payload;
                const input = _input && "object" == typeof _input ? _input : {};
                const request = new httpRequest.K({
                    protocol: "",
                    hostname: "",
                    port: void 0,
                    path: "/",
                    fragment: void 0,
                    query: query,
                    headers: headers,
                    body: void 0
                });
                if (endpoint) {
                    this.updateServiceEndpoint(request, endpoint);
                    this.setHostPrefix(request, operationSchema, input);
                }
                if (input) {
                    const eventStreamMember = ns.getEventStreamMember();
                    if (eventStreamMember) {
                        if (input[eventStreamMember]) {
                            const initialRequest = {};
                            for (const [memberName, memberSchema] of ns.structIterator())if (memberName !== eventStreamMember && input[memberName]) {
                                serializer.write(memberSchema, input[memberName]);
                                initialRequest[memberName] = serializer.flush();
                            }
                            payload = await this.serializeEventStream({
                                eventStream: input[eventStreamMember],
                                requestSchema: ns,
                                initialRequest
                            });
                        }
                    } else {
                        serializer.write(schema, input);
                        payload = serializer.flush();
                    }
                }
                request.headers = Object.assign(request.headers, headers);
                request.query = query;
                request.body = payload;
                request.method = "POST";
                return request;
            }
            async deserializeResponse(operationSchema, context, response) {
                const deserializer = this.deserializer;
                const ns = NormalizedSchema.l1.of(operationSchema.output);
                const dataObject = {};
                if (response.statusCode >= 300) {
                    const bytes = await (0, collect_stream_body.P)(response.body, context);
                    if (bytes.byteLength > 0) Object.assign(dataObject, await deserializer.read(15, bytes));
                    await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
                    throw new Error("@smithy/core/protocols - RPC Protocol error handler failed to throw.");
                }
                for(const header in response.headers){
                    const value = response.headers[header];
                    delete response.headers[header];
                    response.headers[header.toLowerCase()] = value;
                }
                const eventStreamMember = ns.getEventStreamMember();
                if (eventStreamMember) dataObject[eventStreamMember] = await this.deserializeEventStream({
                    response,
                    responseSchema: ns,
                    initialResponseContainer: dataObject
                });
                else {
                    const bytes = await (0, collect_stream_body.P)(response.body, context);
                    if (bytes.byteLength > 0) Object.assign(dataObject, await deserializer.read(ns, bytes));
                }
                dataObject.$metadata = this.deserializeMetadata(response);
                return dataObject;
            }
        }
        var deref = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/schema/deref.js");
        var ProtocolLib = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js");
        var XmlShapeDeserializer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/XmlShapeDeserializer.js");
        var determineTimestampFormat = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/serde/determineTimestampFormat.js");
        var extended_encode_uri_component = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/protocols/extended-encode-uri-component.js");
        var v4 = __webpack_require__("../../../node_modules/.pnpm/@smithy+uuid@1.1.2/node_modules/@smithy/uuid/dist-es/v4.js");
        var NumericValue = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js");
        var date_utils = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js");
        var toBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/toBase64.js");
        var ConfigurableSerdeContext = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js");
        class QueryShapeSerializer extends ConfigurableSerdeContext.B {
            settings;
            buffer;
            constructor(settings){
                super();
                this.settings = settings;
            }
            write(schema, value, prefix = "") {
                if (void 0 === this.buffer) this.buffer = "";
                const ns = NormalizedSchema.l1.of(schema);
                if (prefix && !prefix.endsWith(".")) prefix += ".";
                if (ns.isBlobSchema()) {
                    if ("string" == typeof value || value instanceof Uint8Array) {
                        this.writeKey(prefix);
                        this.writeValue((this.serdeContext?.base64Encoder ?? toBase64.n)(value));
                    }
                } else if (ns.isBooleanSchema() || ns.isNumericSchema() || ns.isStringSchema()) {
                    if (null != value) {
                        this.writeKey(prefix);
                        this.writeValue(String(value));
                    } else if (ns.isIdempotencyToken()) {
                        this.writeKey(prefix);
                        this.writeValue((0, v4.v4)());
                    }
                } else if (ns.isBigIntegerSchema()) {
                    if (null != value) {
                        this.writeKey(prefix);
                        this.writeValue(String(value));
                    }
                } else if (ns.isBigDecimalSchema()) {
                    if (null != value) {
                        this.writeKey(prefix);
                        this.writeValue(value instanceof NumericValue.D ? value.string : String(value));
                    }
                } else if (ns.isTimestampSchema()) {
                    if (value instanceof Date) {
                        this.writeKey(prefix);
                        const format = (0, determineTimestampFormat.V)(ns, this.settings);
                        switch(format){
                            case 5:
                                this.writeValue(value.toISOString().replace(".000Z", "Z"));
                                break;
                            case 6:
                                this.writeValue((0, date_utils.JV)(value));
                                break;
                            case 7:
                                this.writeValue(String(value.getTime() / 1000));
                                break;
                        }
                    }
                } else if (ns.isDocumentSchema()) if (Array.isArray(value)) this.write(79, value, prefix);
                else if (value instanceof Date) this.write(4, value, prefix);
                else if (value instanceof Uint8Array) this.write(21, value, prefix);
                else if (value && "object" == typeof value) this.write(143, value, prefix);
                else {
                    this.writeKey(prefix);
                    this.writeValue(String(value));
                }
                else if (ns.isListSchema()) {
                    if (Array.isArray(value)) if (0 === value.length) {
                        if (this.settings.serializeEmptyLists) {
                            this.writeKey(prefix);
                            this.writeValue("");
                        }
                    } else {
                        const member = ns.getValueSchema();
                        const flat = this.settings.flattenLists || ns.getMergedTraits().xmlFlattened;
                        let i = 1;
                        for (const item of value){
                            if (null == item) continue;
                            const traits = member.getMergedTraits();
                            const suffix = this.getKey("member", traits.xmlName, traits.ec2QueryName);
                            const key = flat ? `${prefix}${i}` : `${prefix}${suffix}.${i}`;
                            this.write(member, item, key);
                            ++i;
                        }
                    }
                } else if (ns.isMapSchema()) {
                    if (value && "object" == typeof value) {
                        const keySchema = ns.getKeySchema();
                        const memberSchema = ns.getValueSchema();
                        const flat = ns.getMergedTraits().xmlFlattened;
                        let i = 1;
                        for (const [k, v] of Object.entries(value)){
                            if (null == v) continue;
                            const keyTraits = keySchema.getMergedTraits();
                            const keySuffix = this.getKey("key", keyTraits.xmlName, keyTraits.ec2QueryName);
                            const key = flat ? `${prefix}${i}.${keySuffix}` : `${prefix}entry.${i}.${keySuffix}`;
                            const valTraits = memberSchema.getMergedTraits();
                            const valueSuffix = this.getKey("value", valTraits.xmlName, valTraits.ec2QueryName);
                            const valueKey = flat ? `${prefix}${i}.${valueSuffix}` : `${prefix}entry.${i}.${valueSuffix}`;
                            this.write(keySchema, k, key);
                            this.write(memberSchema, v, valueKey);
                            ++i;
                        }
                    }
                } else if (ns.isStructSchema()) {
                    if (value && "object" == typeof value) {
                        let didWriteMember = false;
                        for (const [memberName, member] of ns.structIterator()){
                            if (null == value[memberName] && !member.isIdempotencyToken()) continue;
                            const traits = member.getMergedTraits();
                            const suffix = this.getKey(memberName, traits.xmlName, traits.ec2QueryName, "struct");
                            const key = `${prefix}${suffix}`;
                            this.write(member, value[memberName], key);
                            didWriteMember = true;
                        }
                        if (!didWriteMember && ns.isUnionSchema()) {
                            const { $unknown } = value;
                            if (Array.isArray($unknown)) {
                                const [k, v] = $unknown;
                                const key = `${prefix}${k}`;
                                this.write(15, v, key);
                            }
                        }
                    }
                } else if (ns.isUnitSchema()) ;
                else throw new Error(`@aws-sdk/core/protocols - QuerySerializer unrecognized schema type ${ns.getName(true)}`);
            }
            flush() {
                if (void 0 === this.buffer) throw new Error("@aws-sdk/core/protocols - QuerySerializer cannot flush with nothing written to buffer.");
                const str = this.buffer;
                delete this.buffer;
                return str;
            }
            getKey(memberName, xmlName, ec2QueryName, keySource) {
                const { ec2, capitalizeKeys } = this.settings;
                if (ec2 && ec2QueryName) return ec2QueryName;
                const key = xmlName ?? memberName;
                if (capitalizeKeys && "struct" === keySource) return key[0].toUpperCase() + key.slice(1);
                return key;
            }
            writeKey(key) {
                if (key.endsWith(".")) key = key.slice(0, key.length - 1);
                this.buffer += `&${(0, extended_encode_uri_component.$)(key)}=`;
            }
            writeValue(value) {
                this.buffer += (0, extended_encode_uri_component.$)(value);
            }
        }
        class AwsQueryProtocol extends RpcProtocol {
            options;
            serializer;
            deserializer;
            mixin = new ProtocolLib.U();
            constructor(options){
                super({
                    defaultNamespace: options.defaultNamespace,
                    errorTypeRegistries: options.errorTypeRegistries
                });
                this.options = options;
                const settings = {
                    timestampFormat: {
                        useTrait: true,
                        default: 5
                    },
                    httpBindings: false,
                    xmlNamespace: options.xmlNamespace,
                    serviceNamespace: options.defaultNamespace,
                    serializeEmptyLists: true
                };
                this.serializer = new QueryShapeSerializer(settings);
                this.deserializer = new XmlShapeDeserializer._(settings);
            }
            getShapeId() {
                return "aws.protocols#awsQuery";
            }
            setSerdeContext(serdeContext) {
                this.serializer.setSerdeContext(serdeContext);
                this.deserializer.setSerdeContext(serdeContext);
            }
            getPayloadCodec() {
                throw new Error("AWSQuery protocol has no payload codec.");
            }
            async serializeRequest(operationSchema, input, context) {
                const request = await super.serializeRequest(operationSchema, input, context);
                if (!request.path.endsWith("/")) request.path += "/";
                Object.assign(request.headers, {
                    "content-type": "application/x-www-form-urlencoded"
                });
                if ("unit" === (0, deref.L)(operationSchema.input) || !request.body) request.body = "";
                const action = operationSchema.name.split("#")[1] ?? operationSchema.name;
                request.body = `Action=${action}&Version=${this.options.version}` + request.body;
                if (request.body.endsWith("&")) request.body = request.body.slice(-1);
                return request;
            }
            async deserializeResponse(operationSchema, context, response) {
                const deserializer = this.deserializer;
                const ns = NormalizedSchema.l1.of(operationSchema.output);
                const dataObject = {};
                if (response.statusCode >= 300) {
                    const bytes = await (0, collect_stream_body.P)(response.body, context);
                    if (bytes.byteLength > 0) Object.assign(dataObject, await deserializer.read(15, bytes));
                    await this.handleError(operationSchema, context, response, dataObject, this.deserializeMetadata(response));
                }
                for(const header in response.headers){
                    const value = response.headers[header];
                    delete response.headers[header];
                    response.headers[header.toLowerCase()] = value;
                }
                const shortName = operationSchema.name.split("#")[1] ?? operationSchema.name;
                const awsQueryResultKey = ns.isStructSchema() && this.useNestedResult() ? shortName + "Result" : void 0;
                const bytes = await (0, collect_stream_body.P)(response.body, context);
                if (bytes.byteLength > 0) Object.assign(dataObject, await deserializer.read(ns, bytes, awsQueryResultKey));
                const output = {
                    $metadata: this.deserializeMetadata(response),
                    ...dataObject
                };
                return output;
            }
            useNestedResult() {
                return true;
            }
            async handleError(operationSchema, context, response, dataObject, metadata) {
                const errorIdentifier = this.loadQueryErrorCode(response, dataObject) ?? "Unknown";
                this.mixin.compose(this.compositeErrorRegistry, errorIdentifier, this.options.defaultNamespace);
                const errorData = this.loadQueryError(dataObject) ?? {};
                const message = this.loadQueryErrorMessage(dataObject);
                errorData.message = message;
                errorData.Error = {
                    Type: errorData.Type,
                    Code: errorData.Code,
                    Message: message
                };
                const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, errorData, metadata, this.mixin.findQueryCompatibleError);
                const ns = NormalizedSchema.l1.of(errorSchema);
                const ErrorCtor = this.compositeErrorRegistry.getErrorCtor(errorSchema) ?? Error;
                const exception = new ErrorCtor(message);
                const output = {
                    Type: errorData.Error.Type,
                    Code: errorData.Error.Code,
                    Error: errorData.Error
                };
                for (const [name, member] of ns.structIterator()){
                    const target = member.getMergedTraits().xmlName ?? name;
                    const value = errorData[target] ?? dataObject[target];
                    output[name] = this.deserializer.readSchema(member, value);
                }
                throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
                    $fault: ns.getMergedTraits().error,
                    message
                }, output), dataObject);
            }
            loadQueryErrorCode(output, data) {
                const code = (data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error)?.Code;
                if (void 0 !== code) return code;
                if (404 == output.statusCode) return "NotFound";
            }
            loadQueryError(data) {
                return data.Errors?.[0]?.Error ?? data.Errors?.Error ?? data.Error;
            }
            loadQueryErrorMessage(data) {
                const errorData = this.loadQueryError(data);
                return errorData?.message ?? errorData?.Message ?? data.message ?? data.Message ?? "Unknown";
            }
            getDefaultContentType() {
                return "application/x-www-form-urlencoded";
            }
        }
        var NoOpLogger = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@4.12.8/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js");
        var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@4.2.12/node_modules/@smithy/url-parser/dist-es/index.js");
        var fromBase64 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@4.3.2/node_modules/@smithy/util-base64/dist-es/fromBase64.js");
        var fromUtf8 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@4.2.2/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js");
        var toUtf8 = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@4.2.2/node_modules/@smithy/util-utf8/dist-es/toUtf8.js");
        var util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.996.5/node_modules/@aws-sdk/util-endpoints/dist-es/index.js");
        var EndpointCache = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/cache/EndpointCache.js");
        var resolveEndpoint = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/resolveEndpoint.js");
        var customEndpointFunctions = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@3.3.3/node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js");
        const F = "required", G = "type", H = "fn", I = "argv", J = "ref";
        const a = false, b = true, c = "booleanEquals", d = "stringEquals", e = "sigv4", f = "sts", g = "us-east-1", h = "endpoint", ruleset_i = "https://sts.{Region}.{PartitionResult#dnsSuffix}", j = "tree", ruleset_k = "error", l = "getAttr", m = {
            [F]: false,
            [G]: "string"
        }, n = {
            [F]: true,
            default: false,
            [G]: "boolean"
        }, ruleset_o = {
            [J]: "Endpoint"
        }, p = {
            [H]: "isSet",
            [I]: [
                {
                    [J]: "Region"
                }
            ]
        }, q = {
            [J]: "Region"
        }, r = {
            [H]: "aws.partition",
            [I]: [
                q
            ],
            assign: "PartitionResult"
        }, s = {
            [J]: "UseFIPS"
        }, t = {
            [J]: "UseDualStack"
        }, u = {
            url: "https://sts.amazonaws.com",
            properties: {
                authSchemes: [
                    {
                        name: e,
                        signingName: f,
                        signingRegion: g
                    }
                ]
            },
            headers: {}
        }, ruleset_v = {}, w = {
            conditions: [
                {
                    [H]: d,
                    [I]: [
                        q,
                        "aws-global"
                    ]
                }
            ],
            [h]: u,
            [G]: h
        }, x = {
            [H]: c,
            [I]: [
                s,
                true
            ]
        }, y = {
            [H]: c,
            [I]: [
                t,
                true
            ]
        }, z = {
            [H]: l,
            [I]: [
                {
                    [J]: "PartitionResult"
                },
                "supportsFIPS"
            ]
        }, A = {
            [J]: "PartitionResult"
        }, B = {
            [H]: c,
            [I]: [
                true,
                {
                    [H]: l,
                    [I]: [
                        A,
                        "supportsDualStack"
                    ]
                }
            ]
        }, C = [
            {
                [H]: "isSet",
                [I]: [
                    ruleset_o
                ]
            }
        ], D = [
            x
        ], E = [
            y
        ];
        const _data = {
            version: "1.0",
            parameters: {
                Region: m,
                UseDualStack: n,
                UseFIPS: n,
                Endpoint: m,
                UseGlobalEndpoint: n
            },
            rules: [
                {
                    conditions: [
                        {
                            [H]: c,
                            [I]: [
                                {
                                    [J]: "UseGlobalEndpoint"
                                },
                                b
                            ]
                        },
                        {
                            [H]: "not",
                            [I]: C
                        },
                        p,
                        r,
                        {
                            [H]: c,
                            [I]: [
                                s,
                                a
                            ]
                        },
                        {
                            [H]: c,
                            [I]: [
                                t,
                                a
                            ]
                        }
                    ],
                    rules: [
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "ap-northeast-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "ap-south-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "ap-southeast-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "ap-southeast-2"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        w,
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "ca-central-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "eu-central-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "eu-north-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "eu-west-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "eu-west-2"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "eu-west-3"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "sa-east-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        g
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "us-east-2"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "us-west-1"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            conditions: [
                                {
                                    [H]: d,
                                    [I]: [
                                        q,
                                        "us-west-2"
                                    ]
                                }
                            ],
                            endpoint: u,
                            [G]: h
                        },
                        {
                            endpoint: {
                                url: ruleset_i,
                                properties: {
                                    authSchemes: [
                                        {
                                            name: e,
                                            signingName: f,
                                            signingRegion: "{Region}"
                                        }
                                    ]
                                },
                                headers: ruleset_v
                            },
                            [G]: h
                        }
                    ],
                    [G]: j
                },
                {
                    conditions: C,
                    rules: [
                        {
                            conditions: D,
                            error: "Invalid Configuration: FIPS and custom endpoint are not supported",
                            [G]: ruleset_k
                        },
                        {
                            conditions: E,
                            error: "Invalid Configuration: Dualstack and custom endpoint are not supported",
                            [G]: ruleset_k
                        },
                        {
                            endpoint: {
                                url: ruleset_o,
                                properties: ruleset_v,
                                headers: ruleset_v
                            },
                            [G]: h
                        }
                    ],
                    [G]: j
                },
                {
                    conditions: [
                        p
                    ],
                    rules: [
                        {
                            conditions: [
                                r
                            ],
                            rules: [
                                {
                                    conditions: [
                                        x,
                                        y
                                    ],
                                    rules: [
                                        {
                                            conditions: [
                                                {
                                                    [H]: c,
                                                    [I]: [
                                                        b,
                                                        z
                                                    ]
                                                },
                                                B
                                            ],
                                            rules: [
                                                {
                                                    endpoint: {
                                                        url: "https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                                                        properties: ruleset_v,
                                                        headers: ruleset_v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "FIPS and DualStack are enabled, but this partition does not support one or both",
                                            [G]: ruleset_k
                                        }
                                    ],
                                    [G]: j
                                },
                                {
                                    conditions: D,
                                    rules: [
                                        {
                                            conditions: [
                                                {
                                                    [H]: c,
                                                    [I]: [
                                                        z,
                                                        b
                                                    ]
                                                }
                                            ],
                                            rules: [
                                                {
                                                    conditions: [
                                                        {
                                                            [H]: d,
                                                            [I]: [
                                                                {
                                                                    [H]: l,
                                                                    [I]: [
                                                                        A,
                                                                        "name"
                                                                    ]
                                                                },
                                                                "aws-us-gov"
                                                            ]
                                                        }
                                                    ],
                                                    endpoint: {
                                                        url: "https://sts.{Region}.amazonaws.com",
                                                        properties: ruleset_v,
                                                        headers: ruleset_v
                                                    },
                                                    [G]: h
                                                },
                                                {
                                                    endpoint: {
                                                        url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}",
                                                        properties: ruleset_v,
                                                        headers: ruleset_v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "FIPS is enabled but this partition does not support FIPS",
                                            [G]: ruleset_k
                                        }
                                    ],
                                    [G]: j
                                },
                                {
                                    conditions: E,
                                    rules: [
                                        {
                                            conditions: [
                                                B
                                            ],
                                            rules: [
                                                {
                                                    endpoint: {
                                                        url: "https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}",
                                                        properties: ruleset_v,
                                                        headers: ruleset_v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "DualStack is enabled but this partition does not support DualStack",
                                            [G]: ruleset_k
                                        }
                                    ],
                                    [G]: j
                                },
                                w,
                                {
                                    endpoint: {
                                        url: ruleset_i,
                                        properties: ruleset_v,
                                        headers: ruleset_v
                                    },
                                    [G]: h
                                }
                            ],
                            [G]: j
                        }
                    ],
                    [G]: j
                },
                {
                    error: "Invalid Configuration: Missing Region",
                    [G]: ruleset_k
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
                "UseFIPS",
                "UseGlobalEndpoint"
            ]
        });
        const defaultEndpointResolver = (endpointParams, context = {})=>cache.get(endpointParams, ()=>(0, resolveEndpoint.s)(ruleSet, {
                    endpointParams: endpointParams,
                    logger: context.logger
                }));
        customEndpointFunctions.m.aws = util_endpoints_dist_es.UF;
        const getRuntimeConfig = (config)=>({
                apiVersion: "2011-06-15",
                base64Decoder: config?.base64Decoder ?? fromBase64.E,
                base64Encoder: config?.base64Encoder ?? toBase64.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSTSHttpAuthSchemeProvider,
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
                protocol: config?.protocol ?? AwsQueryProtocol,
                protocolSettings: config?.protocolSettings ?? {
                    defaultNamespace: "com.amazonaws.sts",
                    errorTypeRegistries: errorTypeRegistries,
                    xmlNamespace: "https://sts.amazonaws.com/doc/2011-06-15/",
                    version: "2011-06-15",
                    serviceTarget: "AWSSecurityTokenServiceV20110615"
                },
                serviceId: config?.serviceId ?? "STS",
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
                httpAuthSchemes: config?.httpAuthSchemes ?? [
                    {
                        schemeId: "aws.auth#sigv4",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("aws.auth#sigv4") || (async (idProps)=>await config.credentialDefaultProvider(idProps?.__config || {})()),
                        signer: new AwsSdkSigV4Signer.f2()
                    },
                    {
                        schemeId: "smithy.api#noAuth",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("smithy.api#noAuth") || (async ()=>({})),
                        signer: new noAuth.m()
                    }
                ],
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
        class STSClient_STSClient extends client.K {
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
                    httpAuthSchemeParametersProvider: defaultSTSHttpAuthSchemeParametersProvider,
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
        const getCustomizableStsClientCtor = (baseCtor, customizations)=>{
            if (!customizations) return baseCtor;
            return class extends baseCtor {
                constructor(config){
                    super(config);
                    for (const customization of customizations)this.middlewareStack.use(customization);
                }
            };
        };
        const defaultRoleAssumers_getDefaultRoleAssumer = (stsOptions = {}, stsPlugins)=>getDefaultRoleAssumer(stsOptions, getCustomizableStsClientCtor(STSClient_STSClient, stsPlugins));
        const defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins)=>getDefaultRoleAssumerWithWebIdentity(stsOptions, getCustomizableStsClientCtor(STSClient_STSClient, stsPlugins));
    },
    "../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        class NoAuthSigner {
            async sign(httpRequest, identity, signingProperties) {
                return httpRequest;
            }
        }
        __webpack_require__.d(__webpack_exports__, {
            m: ()=>NoAuthSigner
        });
    },
    "../../../node_modules/.pnpm/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/package.json" (module) {
        module.exports = {
            rE: "3.996.17"
        };
    }
};
