"use strict";
exports.ids = [
    "675"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+client-sts@3.540.0_@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/client-sts/dist-es/defaultRoleAssumers.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            cz: ()=>defaultRoleAssumers_getDefaultRoleAssumer,
            I$: ()=>defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@2.5.0/node_modules/@smithy/middleware-endpoint/dist-es/index.js");
        var serdePlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-serde@2.3.0/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js");
        var smithy_client_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@2.5.0/node_modules/@smithy/smithy-client/dist-es/index.js");
        const resolveClientEndpointParameters = (options)=>({
                ...options,
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
        class STSServiceException extends smithy_client_dist_es.TJ {
            constructor(options){
                super(options);
                Object.setPrototypeOf(this, STSServiceException.prototype);
            }
        }
        class ExpiredTokenException extends STSServiceException {
            constructor(opts){
                super({
                    name: "ExpiredTokenException",
                    $fault: "client",
                    ...opts
                });
                this.name = "ExpiredTokenException";
                this.$fault = "client";
                Object.setPrototypeOf(this, ExpiredTokenException.prototype);
            }
        }
        class MalformedPolicyDocumentException extends STSServiceException {
            constructor(opts){
                super({
                    name: "MalformedPolicyDocumentException",
                    $fault: "client",
                    ...opts
                });
                this.name = "MalformedPolicyDocumentException";
                this.$fault = "client";
                Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
            }
        }
        class PackedPolicyTooLargeException extends STSServiceException {
            constructor(opts){
                super({
                    name: "PackedPolicyTooLargeException",
                    $fault: "client",
                    ...opts
                });
                this.name = "PackedPolicyTooLargeException";
                this.$fault = "client";
                Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
            }
        }
        class RegionDisabledException extends STSServiceException {
            constructor(opts){
                super({
                    name: "RegionDisabledException",
                    $fault: "client",
                    ...opts
                });
                this.name = "RegionDisabledException";
                this.$fault = "client";
                Object.setPrototypeOf(this, RegionDisabledException.prototype);
            }
        }
        class IDPRejectedClaimException extends STSServiceException {
            constructor(opts){
                super({
                    name: "IDPRejectedClaimException",
                    $fault: "client",
                    ...opts
                });
                this.name = "IDPRejectedClaimException";
                this.$fault = "client";
                Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
            }
        }
        class InvalidIdentityTokenException extends STSServiceException {
            constructor(opts){
                super({
                    name: "InvalidIdentityTokenException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidIdentityTokenException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
            }
        }
        class IDPCommunicationErrorException extends STSServiceException {
            constructor(opts){
                super({
                    name: "IDPCommunicationErrorException",
                    $fault: "client",
                    ...opts
                });
                this.name = "IDPCommunicationErrorException";
                this.$fault = "client";
                Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
            }
        }
        class InvalidAuthorizationMessageException extends STSServiceException {
            constructor(opts){
                super({
                    name: "InvalidAuthorizationMessageException",
                    $fault: "client",
                    ...opts
                });
                this.name = "InvalidAuthorizationMessageException";
                this.$fault = "client";
                Object.setPrototypeOf(this, InvalidAuthorizationMessageException.prototype);
            }
        }
        const CredentialsFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.SecretAccessKey && {
                    SecretAccessKey: smithy_client_dist_es.$H
                }
            });
        const AssumeRoleResponseFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.Credentials && {
                    Credentials: CredentialsFilterSensitiveLog(obj.Credentials)
                }
            });
        const AssumeRoleWithWebIdentityRequestFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.WebIdentityToken && {
                    WebIdentityToken: smithy_client_dist_es.$H
                }
            });
        const AssumeRoleWithWebIdentityResponseFilterSensitiveLog = (obj)=>({
                ...obj,
                ...obj.Credentials && {
                    Credentials: CredentialsFilterSensitiveLog(obj.Credentials)
                }
            });
        var parseXmlBody = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/protocols/xml/parseXmlBody.js");
        var protocol_http_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@3.3.0/node_modules/@smithy/protocol-http/dist-es/index.js");
        const se_AssumeRoleCommand = async (input, context)=>{
            const headers = SHARED_HEADERS;
            let body;
            body = buildFormUrlencodedString({
                ...se_AssumeRoleRequest(input, context),
                [_A]: _AR,
                [_V]: _
            });
            return buildHttpRpcRequest(context, headers, "/", void 0, body);
        };
        const se_AssumeRoleWithWebIdentityCommand = async (input, context)=>{
            const headers = SHARED_HEADERS;
            let body;
            body = buildFormUrlencodedString({
                ...se_AssumeRoleWithWebIdentityRequest(input, context),
                [_A]: _ARWWI,
                [_V]: _
            });
            return buildHttpRpcRequest(context, headers, "/", void 0, body);
        };
        const de_AssumeRoleCommand = async (output, context)=>{
            if (output.statusCode >= 300) return de_CommandError(output, context);
            const data = await (0, parseXmlBody.t_)(output.body, context);
            let contents = {};
            contents = de_AssumeRoleResponse(data.AssumeRoleResult, context);
            const response = {
                $metadata: deserializeMetadata(output),
                ...contents
            };
            return response;
        };
        const de_AssumeRoleWithWebIdentityCommand = async (output, context)=>{
            if (output.statusCode >= 300) return de_CommandError(output, context);
            const data = await (0, parseXmlBody.t_)(output.body, context);
            let contents = {};
            contents = de_AssumeRoleWithWebIdentityResponse(data.AssumeRoleWithWebIdentityResult, context);
            const response = {
                $metadata: deserializeMetadata(output),
                ...contents
            };
            return response;
        };
        const de_CommandError = async (output, context)=>{
            const parsedOutput = {
                ...output,
                body: await (0, parseXmlBody.FI)(output.body, context)
            };
            const errorCode = loadQueryErrorCode(output, parsedOutput.body);
            switch(errorCode){
                case "ExpiredTokenException":
                case "com.amazonaws.sts#ExpiredTokenException":
                    throw await de_ExpiredTokenExceptionRes(parsedOutput, context);
                case "MalformedPolicyDocument":
                case "com.amazonaws.sts#MalformedPolicyDocumentException":
                    throw await de_MalformedPolicyDocumentExceptionRes(parsedOutput, context);
                case "PackedPolicyTooLarge":
                case "com.amazonaws.sts#PackedPolicyTooLargeException":
                    throw await de_PackedPolicyTooLargeExceptionRes(parsedOutput, context);
                case "RegionDisabledException":
                case "com.amazonaws.sts#RegionDisabledException":
                    throw await de_RegionDisabledExceptionRes(parsedOutput, context);
                case "IDPRejectedClaim":
                case "com.amazonaws.sts#IDPRejectedClaimException":
                    throw await de_IDPRejectedClaimExceptionRes(parsedOutput, context);
                case "InvalidIdentityToken":
                case "com.amazonaws.sts#InvalidIdentityTokenException":
                    throw await de_InvalidIdentityTokenExceptionRes(parsedOutput, context);
                case "IDPCommunicationError":
                case "com.amazonaws.sts#IDPCommunicationErrorException":
                    throw await de_IDPCommunicationErrorExceptionRes(parsedOutput, context);
                case "InvalidAuthorizationMessageException":
                case "com.amazonaws.sts#InvalidAuthorizationMessageException":
                    throw await de_InvalidAuthorizationMessageExceptionRes(parsedOutput, context);
                default:
                    const parsedBody = parsedOutput.body;
                    return throwDefaultError({
                        output,
                        parsedBody: parsedBody.Error,
                        errorCode
                    });
            }
        };
        const de_ExpiredTokenExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_ExpiredTokenException(body.Error, context);
            const exception = new ExpiredTokenException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_IDPCommunicationErrorExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_IDPCommunicationErrorException(body.Error, context);
            const exception = new IDPCommunicationErrorException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_IDPRejectedClaimExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_IDPRejectedClaimException(body.Error, context);
            const exception = new IDPRejectedClaimException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_InvalidAuthorizationMessageExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_InvalidAuthorizationMessageException(body.Error, context);
            const exception = new InvalidAuthorizationMessageException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_InvalidIdentityTokenExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_InvalidIdentityTokenException(body.Error, context);
            const exception = new InvalidIdentityTokenException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_MalformedPolicyDocumentExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_MalformedPolicyDocumentException(body.Error, context);
            const exception = new MalformedPolicyDocumentException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_PackedPolicyTooLargeExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_PackedPolicyTooLargeException(body.Error, context);
            const exception = new PackedPolicyTooLargeException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const de_RegionDisabledExceptionRes = async (parsedOutput, context)=>{
            const body = parsedOutput.body;
            const deserialized = de_RegionDisabledException(body.Error, context);
            const exception = new RegionDisabledException({
                $metadata: deserializeMetadata(parsedOutput),
                ...deserialized
            });
            return (0, smithy_client_dist_es.Mw)(exception, body);
        };
        const se_AssumeRoleRequest = (input, context)=>{
            const entries = {};
            if (null != input[_RA]) entries[_RA] = input[_RA];
            if (null != input[_RSN]) entries[_RSN] = input[_RSN];
            if (null != input[_PA]) {
                const memberEntries = se_policyDescriptorListType(input[_PA], context);
                if (input[_PA]?.length === 0) entries.PolicyArns = [];
                Object.entries(memberEntries).forEach(([key, value])=>{
                    const loc = `PolicyArns.${key}`;
                    entries[loc] = value;
                });
            }
            if (null != input[_P]) entries[_P] = input[_P];
            if (null != input[_DS]) entries[_DS] = input[_DS];
            if (null != input[_T]) {
                const memberEntries = se_tagListType(input[_T], context);
                if (input[_T]?.length === 0) entries.Tags = [];
                Object.entries(memberEntries).forEach(([key, value])=>{
                    const loc = `Tags.${key}`;
                    entries[loc] = value;
                });
            }
            if (null != input[_TTK]) {
                const memberEntries = se_tagKeyListType(input[_TTK], context);
                if (input[_TTK]?.length === 0) entries.TransitiveTagKeys = [];
                Object.entries(memberEntries).forEach(([key, value])=>{
                    const loc = `TransitiveTagKeys.${key}`;
                    entries[loc] = value;
                });
            }
            if (null != input[_EI]) entries[_EI] = input[_EI];
            if (null != input[_SN]) entries[_SN] = input[_SN];
            if (null != input[_TC]) entries[_TC] = input[_TC];
            if (null != input[_SI]) entries[_SI] = input[_SI];
            if (null != input[_PC]) {
                const memberEntries = se_ProvidedContextsListType(input[_PC], context);
                if (input[_PC]?.length === 0) entries.ProvidedContexts = [];
                Object.entries(memberEntries).forEach(([key, value])=>{
                    const loc = `ProvidedContexts.${key}`;
                    entries[loc] = value;
                });
            }
            return entries;
        };
        const se_AssumeRoleWithWebIdentityRequest = (input, context)=>{
            const entries = {};
            if (null != input[_RA]) entries[_RA] = input[_RA];
            if (null != input[_RSN]) entries[_RSN] = input[_RSN];
            if (null != input[_WIT]) entries[_WIT] = input[_WIT];
            if (null != input[_PI]) entries[_PI] = input[_PI];
            if (null != input[_PA]) {
                const memberEntries = se_policyDescriptorListType(input[_PA], context);
                if (input[_PA]?.length === 0) entries.PolicyArns = [];
                Object.entries(memberEntries).forEach(([key, value])=>{
                    const loc = `PolicyArns.${key}`;
                    entries[loc] = value;
                });
            }
            if (null != input[_P]) entries[_P] = input[_P];
            if (null != input[_DS]) entries[_DS] = input[_DS];
            return entries;
        };
        const se_policyDescriptorListType = (input, context)=>{
            const entries = {};
            let counter = 1;
            for (const entry of input){
                if (null === entry) continue;
                const memberEntries = se_PolicyDescriptorType(entry, context);
                Object.entries(memberEntries).forEach(([key, value])=>{
                    entries[`member.${counter}.${key}`] = value;
                });
                counter++;
            }
            return entries;
        };
        const se_PolicyDescriptorType = (input, context)=>{
            const entries = {};
            if (null != input[_a]) entries[_a] = input[_a];
            return entries;
        };
        const se_ProvidedContext = (input, context)=>{
            const entries = {};
            if (null != input[_PAro]) entries[_PAro] = input[_PAro];
            if (null != input[_CA]) entries[_CA] = input[_CA];
            return entries;
        };
        const se_ProvidedContextsListType = (input, context)=>{
            const entries = {};
            let counter = 1;
            for (const entry of input){
                if (null === entry) continue;
                const memberEntries = se_ProvidedContext(entry, context);
                Object.entries(memberEntries).forEach(([key, value])=>{
                    entries[`member.${counter}.${key}`] = value;
                });
                counter++;
            }
            return entries;
        };
        const se_Tag = (input, context)=>{
            const entries = {};
            if (null != input[_K]) entries[_K] = input[_K];
            if (null != input[_Va]) entries[_Va] = input[_Va];
            return entries;
        };
        const se_tagKeyListType = (input, context)=>{
            const entries = {};
            let counter = 1;
            for (const entry of input)if (null !== entry) {
                entries[`member.${counter}`] = entry;
                counter++;
            }
            return entries;
        };
        const se_tagListType = (input, context)=>{
            const entries = {};
            let counter = 1;
            for (const entry of input){
                if (null === entry) continue;
                const memberEntries = se_Tag(entry, context);
                Object.entries(memberEntries).forEach(([key, value])=>{
                    entries[`member.${counter}.${key}`] = value;
                });
                counter++;
            }
            return entries;
        };
        const de_AssumedRoleUser = (output, context)=>{
            const contents = {};
            if (null != output[_ARI]) contents[_ARI] = (0, smithy_client_dist_es.lK)(output[_ARI]);
            if (null != output[_Ar]) contents[_Ar] = (0, smithy_client_dist_es.lK)(output[_Ar]);
            return contents;
        };
        const de_AssumeRoleResponse = (output, context)=>{
            const contents = {};
            if (null != output[_C]) contents[_C] = de_Credentials(output[_C], context);
            if (null != output[_ARU]) contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
            if (null != output[_PPS]) contents[_PPS] = (0, smithy_client_dist_es.xW)(output[_PPS]);
            if (null != output[_SI]) contents[_SI] = (0, smithy_client_dist_es.lK)(output[_SI]);
            return contents;
        };
        const de_AssumeRoleWithWebIdentityResponse = (output, context)=>{
            const contents = {};
            if (null != output[_C]) contents[_C] = de_Credentials(output[_C], context);
            if (null != output[_SFWIT]) contents[_SFWIT] = (0, smithy_client_dist_es.lK)(output[_SFWIT]);
            if (null != output[_ARU]) contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
            if (null != output[_PPS]) contents[_PPS] = (0, smithy_client_dist_es.xW)(output[_PPS]);
            if (null != output[_Pr]) contents[_Pr] = (0, smithy_client_dist_es.lK)(output[_Pr]);
            if (null != output[_Au]) contents[_Au] = (0, smithy_client_dist_es.lK)(output[_Au]);
            if (null != output[_SI]) contents[_SI] = (0, smithy_client_dist_es.lK)(output[_SI]);
            return contents;
        };
        const de_Credentials = (output, context)=>{
            const contents = {};
            if (null != output[_AKI]) contents[_AKI] = (0, smithy_client_dist_es.lK)(output[_AKI]);
            if (null != output[_SAK]) contents[_SAK] = (0, smithy_client_dist_es.lK)(output[_SAK]);
            if (null != output[_STe]) contents[_STe] = (0, smithy_client_dist_es.lK)(output[_STe]);
            if (null != output[_E]) contents[_E] = (0, smithy_client_dist_es.Y0)((0, smithy_client_dist_es.t_)(output[_E]));
            return contents;
        };
        const de_ExpiredTokenException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_IDPCommunicationErrorException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_IDPRejectedClaimException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_InvalidAuthorizationMessageException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_InvalidIdentityTokenException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_MalformedPolicyDocumentException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_PackedPolicyTooLargeException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const de_RegionDisabledException = (output, context)=>{
            const contents = {};
            if (null != output[_m]) contents[_m] = (0, smithy_client_dist_es.lK)(output[_m]);
            return contents;
        };
        const deserializeMetadata = (output)=>({
                httpStatusCode: output.statusCode,
                requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
                extendedRequestId: output.headers["x-amz-id-2"],
                cfId: output.headers["x-amz-cf-id"]
            });
        const throwDefaultError = (0, smithy_client_dist_es.jr)(STSServiceException);
        const buildHttpRpcRequest = async (context, headers, path, resolvedHostname, body)=>{
            const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
            const contents = {
                protocol,
                hostname,
                port,
                method: "POST",
                path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
                headers
            };
            if (void 0 !== resolvedHostname) contents.hostname = resolvedHostname;
            if (void 0 !== body) contents.body = body;
            return new protocol_http_dist_es.Kd(contents);
        };
        const SHARED_HEADERS = {
            "content-type": "application/x-www-form-urlencoded"
        };
        const _ = "2011-06-15";
        const _A = "Action";
        const _AKI = "AccessKeyId";
        const _AR = "AssumeRole";
        const _ARI = "AssumedRoleId";
        const _ARU = "AssumedRoleUser";
        const _ARWWI = "AssumeRoleWithWebIdentity";
        const _Ar = "Arn";
        const _Au = "Audience";
        const _C = "Credentials";
        const _CA = "ContextAssertion";
        const _DS = "DurationSeconds";
        const _E = "Expiration";
        const _EI = "ExternalId";
        const _K = "Key";
        const _P = "Policy";
        const _PA = "PolicyArns";
        const _PAro = "ProviderArn";
        const _PC = "ProvidedContexts";
        const _PI = "ProviderId";
        const _PPS = "PackedPolicySize";
        const _Pr = "Provider";
        const _RA = "RoleArn";
        const _RSN = "RoleSessionName";
        const _SAK = "SecretAccessKey";
        const _SFWIT = "SubjectFromWebIdentityToken";
        const _SI = "SourceIdentity";
        const _SN = "SerialNumber";
        const _STe = "SessionToken";
        const _T = "Tags";
        const _TC = "TokenCode";
        const _TTK = "TransitiveTagKeys";
        const _V = "Version";
        const _Va = "Value";
        const _WIT = "WebIdentityToken";
        const _a = "arn";
        const _m = "message";
        const buildFormUrlencodedString = (formEntries)=>Object.entries(formEntries).map(([key, value])=>(0, smithy_client_dist_es.$6)(key) + "=" + (0, smithy_client_dist_es.$6)(value)).join("&");
        const loadQueryErrorCode = (output, data)=>{
            if (data.Error?.Code !== void 0) return data.Error.Code;
            if (404 == output.statusCode) return "NotFound";
        };
        class AssumeRoleCommand extends smithy_client_dist_es.uB.classBuilder().ep({
            ...commonParams
        }).m(function(Command, cs, config, o) {
            return [
                (0, serdePlugin.TM)(config, this.serialize, this.deserialize),
                (0, dist_es.rD)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSecurityTokenServiceV20110615", "AssumeRole", {}).n("STSClient", "AssumeRoleCommand").f(void 0, AssumeRoleResponseFilterSensitiveLog).ser(se_AssumeRoleCommand).de(de_AssumeRoleCommand).build() {
        }
        class AssumeRoleWithWebIdentityCommand extends smithy_client_dist_es.uB.classBuilder().ep({
            ...commonParams
        }).m(function(Command, cs, config, o) {
            return [
                (0, serdePlugin.TM)(config, this.serialize, this.deserialize),
                (0, dist_es.rD)(config, Command.getEndpointParameterInstructions())
            ];
        }).s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {}).n("STSClient", "AssumeRoleWithWebIdentityCommand").f(AssumeRoleWithWebIdentityRequestFilterSensitiveLog, AssumeRoleWithWebIdentityResponseFilterSensitiveLog).ser(se_AssumeRoleWithWebIdentityCommand).de(de_AssumeRoleWithWebIdentityCommand).build() {
        }
        const ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
        const resolveRegion = async (_region, _parentRegion, credentialProviderLogger)=>{
            const region = "function" == typeof _region ? await _region() : _region;
            const parentRegion = "function" == typeof _parentRegion ? await _parentRegion() : _parentRegion;
            credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (provider)`, `${parentRegion} (parent client)`, `${ASSUME_ROLE_DEFAULT_REGION} (STS default)`);
            return region ?? parentRegion ?? ASSUME_ROLE_DEFAULT_REGION;
        };
        const getDefaultRoleAssumer = (stsOptions, stsClientCtor)=>{
            let stsClient;
            let closureSourceCreds;
            return async (sourceCreds, params)=>{
                closureSourceCreds = sourceCreds;
                if (!stsClient) {
                    const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger } = stsOptions;
                    const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
                    stsClient = new stsClientCtor({
                        credentialDefaultProvider: ()=>async ()=>closureSourceCreds,
                        region: resolvedRegion,
                        requestHandler: requestHandler,
                        logger: logger
                    });
                }
                const { Credentials } = await stsClient.send(new AssumeRoleCommand(params));
                if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
                return {
                    accessKeyId: Credentials.AccessKeyId,
                    secretAccessKey: Credentials.SecretAccessKey,
                    sessionToken: Credentials.SessionToken,
                    expiration: Credentials.Expiration,
                    credentialScope: Credentials.CredentialScope
                };
            };
        };
        const getDefaultRoleAssumerWithWebIdentity = (stsOptions, stsClientCtor)=>{
            let stsClient;
            return async (params)=>{
                if (!stsClient) {
                    const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger } = stsOptions;
                    const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
                    stsClient = new stsClientCtor({
                        region: resolvedRegion,
                        requestHandler: requestHandler,
                        logger: logger
                    });
                }
                const { Credentials } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
                if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
                return {
                    accessKeyId: Credentials.AccessKeyId,
                    secretAccessKey: Credentials.SecretAccessKey,
                    sessionToken: Credentials.SessionToken,
                    expiration: Credentials.Expiration,
                    credentialScope: Credentials.CredentialScope
                };
            };
        };
        var middleware_host_header_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-host-header@3.535.0/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js");
        var loggerMiddleware = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-logger@3.535.0/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js");
        var middleware_recursion_detection_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-recursion-detection@3.535.0/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/index.js");
        var middleware_user_agent_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.540.0/node_modules/@aws-sdk/middleware-user-agent/dist-es/index.js");
        var config_resolver_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@2.2.0/node_modules/@smithy/config-resolver/dist-es/index.js");
        var core_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@1.4.0/node_modules/@smithy/core/dist-es/index.js");
        var middleware_content_length_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-content-length@2.2.0/node_modules/@smithy/middleware-content-length/dist-es/index.js");
        var middleware_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@2.2.0/node_modules/@smithy/middleware-retry/dist-es/index.js");
        var resolveAwsSdkSigV4Config = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
        var util_middleware_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@2.2.0/node_modules/@smithy/util-middleware/dist-es/index.js");
        const defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input)=>({
                operation: (0, util_middleware_dist_es.u)(context).operation,
                region: await (0, util_middleware_dist_es.t)(config.region)() || (()=>{
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
                case "AssumeRoleWithSAML":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                case "AssumeRoleWithWebIdentity":
                    options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
                    break;
                default:
                    options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
            }
            return options;
        };
        const resolveStsAuthConfig = (input)=>({
                ...input,
                stsClientCtor: STSClient
            });
        const resolveHttpAuthSchemeConfig = (config)=>{
            const config_0 = resolveStsAuthConfig(config);
            const config_1 = (0, resolveAwsSdkSigV4Config.h)(config_0);
            return {
                ...config_1
            };
        };
        var package_namespaceObject = {
            rE: "3.540.0"
        };
        const credentialDefaultProvider_defaultProvider = (input)=>()=>Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "../../../node_modules/.pnpm/@aws-sdk+credential-provider-node@3.540.0/node_modules/@aws-sdk/credential-provider-node/dist-es/index.js")).then(({ defaultProvider })=>defaultProvider(input)());
        var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/client/emitWarningIfUnsupportedVersion.js");
        var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.535.0/node_modules/@aws-sdk/core/dist-es/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
        var util_user_agent_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.535.0/node_modules/@aws-sdk/util-user-agent-node/dist-es/index.js");
        var hash_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+hash-node@2.2.0/node_modules/@smithy/hash-node/dist-es/index.js");
        var node_config_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@2.3.0/node_modules/@smithy/node-config-provider/dist-es/index.js");
        var node_http_handler_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@2.5.0/node_modules/@smithy/node-http-handler/dist-es/index.js");
        var util_body_length_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-body-length-node@2.3.0/node_modules/@smithy/util-body-length-node/dist-es/index.js");
        var util_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-retry@2.2.0/node_modules/@smithy/util-retry/dist-es/index.js");
        var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@2.2.0/node_modules/@smithy/url-parser/dist-es/index.js");
        var util_base64_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@2.3.0/node_modules/@smithy/util-base64/dist-es/index.js");
        var util_utf8_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@2.3.0/node_modules/@smithy/util-utf8/dist-es/index.js");
        var util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.540.0/node_modules/@aws-sdk/util-endpoints/dist-es/index.js");
        var _smithy_util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@1.2.0/node_modules/@smithy/util-endpoints/dist-es/index.js");
        const F = "required", G = "type", H = "fn", I = "argv", J = "ref";
        const a = false, b = true, c = "booleanEquals", d = "stringEquals", e = "sigv4", f = "sts", g = "us-east-1", h = "endpoint", i = "https://sts.{Region}.{PartitionResult#dnsSuffix}", j = "tree", k = "error", l = "getAttr", m = {
            [F]: false,
            [G]: "String"
        }, n = {
            [F]: true,
            default: false,
            [G]: "Boolean"
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
        }, ruleset_t = {
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
        }, v = {}, w = {
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
                ruleset_t,
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
                                ruleset_t,
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
                                url: i,
                                properties: {
                                    authSchemes: [
                                        {
                                            name: e,
                                            signingName: f,
                                            signingRegion: "{Region}"
                                        }
                                    ]
                                },
                                headers: v
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
                            [G]: k
                        },
                        {
                            conditions: E,
                            error: "Invalid Configuration: Dualstack and custom endpoint are not supported",
                            [G]: k
                        },
                        {
                            endpoint: {
                                url: ruleset_o,
                                properties: v,
                                headers: v
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
                                                        properties: v,
                                                        headers: v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "FIPS and DualStack are enabled, but this partition does not support one or both",
                                            [G]: k
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
                                                        properties: v,
                                                        headers: v
                                                    },
                                                    [G]: h
                                                },
                                                {
                                                    endpoint: {
                                                        url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}",
                                                        properties: v,
                                                        headers: v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "FIPS is enabled but this partition does not support FIPS",
                                            [G]: k
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
                                                        properties: v,
                                                        headers: v
                                                    },
                                                    [G]: h
                                                }
                                            ],
                                            [G]: j
                                        },
                                        {
                                            error: "DualStack is enabled but this partition does not support DualStack",
                                            [G]: k
                                        }
                                    ],
                                    [G]: j
                                },
                                w,
                                {
                                    endpoint: {
                                        url: i,
                                        properties: v,
                                        headers: v
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
                    [G]: k
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
                apiVersion: "2011-06-15",
                base64Decoder: config?.base64Decoder ?? util_base64_dist_es.E,
                base64Encoder: config?.base64Encoder ?? util_base64_dist_es.n,
                disableHostPrefix: config?.disableHostPrefix ?? false,
                endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
                extensions: config?.extensions ?? [],
                httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSTSHttpAuthSchemeProvider,
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
                serviceId: config?.serviceId ?? "STS",
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
                httpAuthSchemes: config?.httpAuthSchemes ?? [
                    {
                        schemeId: "aws.auth#sigv4",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("aws.auth#sigv4") || (async (idProps)=>await credentialDefaultProvider_defaultProvider(idProps?.__config || {})()),
                        signer: new AwsSdkSigV4Signer.f()
                    },
                    {
                        schemeId: "smithy.api#noAuth",
                        identityProvider: (ipc)=>ipc.getIdentityProvider("smithy.api#noAuth") || (async ()=>({})),
                        signer: new core_dist_es.mR()
                    }
                ],
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
        class STSClient extends smithy_client_dist_es.Kj {
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
                return defaultSTSHttpAuthSchemeParametersProvider;
            }
            getIdentityProviderConfigProvider() {
                return async (config)=>new core_dist_es.h$({
                        "aws.auth#sigv4": config.credentials
                    });
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
        const defaultRoleAssumers_getDefaultRoleAssumer = (stsOptions = {}, stsPlugins)=>getDefaultRoleAssumer(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
        const defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins)=>getDefaultRoleAssumerWithWebIdentity(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
    },
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
    }
};
