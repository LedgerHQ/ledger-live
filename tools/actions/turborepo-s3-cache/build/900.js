"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ (function () {
  return typeof document === 'undefined'
    ? new (require('url'.replace('', '')).URL)('file:' + __filename).href
    : (document.currentScript && document.currentScript.src) ||
      new URL('main.js', document.baseURI).href;
})();
;
exports.ids = ["900"];
exports.modules = {
"../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/index.js"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  getDefaultRoleAssumerWithWebIdentity: () => (/* reexport */ defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity),
  getDefaultRoleAssumer: () => (/* reexport */ defaultRoleAssumers_getDefaultRoleAssumer)
});

// UNUSED EXPORTS: AssumeRoleResponseFilterSensitiveLog, decorateDefaultCredentialProvider, GetAccessKeyInfoCommand, GetCallerIdentityCommand, AssumeRoleWithSAMLResponseFilterSensitiveLog, InvalidAuthorizationMessageException, MalformedPolicyDocumentException, DecodeAuthorizationMessageCommand, AssumeRoleWithWebIdentityRequestFilterSensitiveLog, $Command, RegionDisabledException, GetFederationTokenResponseFilterSensitiveLog, __Client, AssumeRoleCommand, AssumeRoleWithSAMLCommand, AssumeRoleWithWebIdentityResponseFilterSensitiveLog, ExpiredTokenException, IDPCommunicationErrorException, PackedPolicyTooLargeException, STS, STSClient, CredentialsFilterSensitiveLog, STSServiceException, IDPRejectedClaimException, GetFederationTokenCommand, GetSessionTokenCommand, GetSessionTokenResponseFilterSensitiveLog, AssumeRoleWithSAMLRequestFilterSensitiveLog, InvalidIdentityTokenException, AssumeRoleWithWebIdentityCommand

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-endpoint@3.1.1/node_modules/@smithy/middleware-endpoint/dist-es/index.js + 10 modules
var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@3.1.1/node_modules/@smithy/middleware-endpoint/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-serde@3.0.4/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js + 2 modules
var serdePlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-serde@3.0.4/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+smithy-client@3.3.0/node_modules/@smithy/smithy-client/dist-es/index.js + 23 modules
var smithy_client_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@3.3.0/node_modules/@smithy/smithy-client/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/endpoint/EndpointParameters.js
const resolveClientEndpointParameters = (options) => {
    return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        useGlobalEndpoint: options.useGlobalEndpoint ?? false,
        defaultSigningName: "sts",
    };
};
const commonParams = {
    UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/models/STSServiceException.js


class STSServiceException extends smithy_client_dist_es/* .ServiceException */.TJ {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, STSServiceException.prototype);
    }
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/models/models_0.js


class ExpiredTokenException extends STSServiceException {
    constructor(opts) {
        super({
            name: "ExpiredTokenException",
            $fault: "client",
            ...opts,
        });
        this.name = "ExpiredTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, ExpiredTokenException.prototype);
    }
}
class MalformedPolicyDocumentException extends STSServiceException {
    constructor(opts) {
        super({
            name: "MalformedPolicyDocumentException",
            $fault: "client",
            ...opts,
        });
        this.name = "MalformedPolicyDocumentException";
        this.$fault = "client";
        Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
    }
}
class PackedPolicyTooLargeException extends STSServiceException {
    constructor(opts) {
        super({
            name: "PackedPolicyTooLargeException",
            $fault: "client",
            ...opts,
        });
        this.name = "PackedPolicyTooLargeException";
        this.$fault = "client";
        Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
    }
}
class RegionDisabledException extends STSServiceException {
    constructor(opts) {
        super({
            name: "RegionDisabledException",
            $fault: "client",
            ...opts,
        });
        this.name = "RegionDisabledException";
        this.$fault = "client";
        Object.setPrototypeOf(this, RegionDisabledException.prototype);
    }
}
class IDPRejectedClaimException extends STSServiceException {
    constructor(opts) {
        super({
            name: "IDPRejectedClaimException",
            $fault: "client",
            ...opts,
        });
        this.name = "IDPRejectedClaimException";
        this.$fault = "client";
        Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
    }
}
class InvalidIdentityTokenException extends STSServiceException {
    constructor(opts) {
        super({
            name: "InvalidIdentityTokenException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidIdentityTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
    }
}
class IDPCommunicationErrorException extends STSServiceException {
    constructor(opts) {
        super({
            name: "IDPCommunicationErrorException",
            $fault: "client",
            ...opts,
        });
        this.name = "IDPCommunicationErrorException";
        this.$fault = "client";
        Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
    }
}
class InvalidAuthorizationMessageException extends STSServiceException {
    constructor(opts) {
        super({
            name: "InvalidAuthorizationMessageException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidAuthorizationMessageException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidAuthorizationMessageException.prototype);
    }
}
const CredentialsFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SecretAccessKey && { SecretAccessKey: smithy_client_dist_es/* .SENSITIVE_STRING */.$H }),
});
const AssumeRoleResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
const AssumeRoleWithSAMLRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.SAMLAssertion && { SAMLAssertion: SENSITIVE_STRING }),
});
const AssumeRoleWithSAMLResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
const AssumeRoleWithWebIdentityRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.WebIdentityToken && { WebIdentityToken: smithy_client_dist_es/* .SENSITIVE_STRING */.$H }),
});
const AssumeRoleWithWebIdentityResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
const GetFederationTokenResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});
const GetSessionTokenResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }),
});

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js
var parseXmlBody = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+protocol-http@4.1.1/node_modules/@smithy/protocol-http/dist-es/index.js + 5 modules
var protocol_http_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@4.1.1/node_modules/@smithy/protocol-http/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/protocols/Aws_query.js





const se_AssumeRoleCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_AssumeRoleRequest(input, context),
        [_A]: _AR,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_AssumeRoleWithSAMLCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_AssumeRoleWithSAMLRequest(input, context),
        [_A]: _ARWSAML,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_AssumeRoleWithWebIdentityCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_AssumeRoleWithWebIdentityRequest(input, context),
        [_A]: _ARWWI,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_DecodeAuthorizationMessageCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_DecodeAuthorizationMessageRequest(input, context),
        [_A]: _DAM,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_GetAccessKeyInfoCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_GetAccessKeyInfoRequest(input, context),
        [_A]: _GAKI,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_GetCallerIdentityCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_GetCallerIdentityRequest(input, context),
        [_A]: _GCI,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_GetFederationTokenCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_GetFederationTokenRequest(input, context),
        [_A]: _GFT,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const se_GetSessionTokenCommand = async (input, context) => {
    const headers = SHARED_HEADERS;
    let body;
    body = buildFormUrlencodedString({
        ...se_GetSessionTokenRequest(input, context),
        [_A]: _GST,
        [_V]: _,
    });
    return buildHttpRpcRequest(context, headers, "/", undefined, body);
};
const de_AssumeRoleCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await (0,parseXmlBody/* .parseXmlBody */.t_)(output.body, context);
    let contents = {};
    contents = de_AssumeRoleResponse(data.AssumeRoleResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_AssumeRoleWithSAMLCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_AssumeRoleWithSAMLResponse(data.AssumeRoleWithSAMLResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_AssumeRoleWithWebIdentityCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await (0,parseXmlBody/* .parseXmlBody */.t_)(output.body, context);
    let contents = {};
    contents = de_AssumeRoleWithWebIdentityResponse(data.AssumeRoleWithWebIdentityResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_DecodeAuthorizationMessageCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_DecodeAuthorizationMessageResponse(data.DecodeAuthorizationMessageResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_GetAccessKeyInfoCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_GetAccessKeyInfoResponse(data.GetAccessKeyInfoResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_GetCallerIdentityCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_GetCallerIdentityResponse(data.GetCallerIdentityResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_GetFederationTokenCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_GetFederationTokenResponse(data.GetFederationTokenResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_GetSessionTokenCommand = async (output, context) => {
    if (output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const data = await parseBody(output.body, context);
    let contents = {};
    contents = de_GetSessionTokenResponse(data.GetSessionTokenResult, context);
    const response = {
        $metadata: deserializeMetadata(output),
        ...contents,
    };
    return response;
};
const de_CommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await (0,parseXmlBody/* .parseXmlErrorBody */.FI)(output.body, context),
    };
    const errorCode = loadQueryErrorCode(output, parsedOutput.body);
    switch (errorCode) {
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
                errorCode,
            });
    }
};
const de_ExpiredTokenExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_ExpiredTokenException(body.Error, context);
    const exception = new ExpiredTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_IDPCommunicationErrorExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_IDPCommunicationErrorException(body.Error, context);
    const exception = new IDPCommunicationErrorException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_IDPRejectedClaimExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_IDPRejectedClaimException(body.Error, context);
    const exception = new IDPRejectedClaimException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_InvalidAuthorizationMessageExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_InvalidAuthorizationMessageException(body.Error, context);
    const exception = new InvalidAuthorizationMessageException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_InvalidIdentityTokenExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_InvalidIdentityTokenException(body.Error, context);
    const exception = new InvalidIdentityTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_MalformedPolicyDocumentExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_MalformedPolicyDocumentException(body.Error, context);
    const exception = new MalformedPolicyDocumentException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_PackedPolicyTooLargeExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_PackedPolicyTooLargeException(body.Error, context);
    const exception = new PackedPolicyTooLargeException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const de_RegionDisabledExceptionRes = async (parsedOutput, context) => {
    const body = parsedOutput.body;
    const deserialized = de_RegionDisabledException(body.Error, context);
    const exception = new RegionDisabledException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, body);
};
const se_AssumeRoleRequest = (input, context) => {
    const entries = {};
    if (input[_RA] != null) {
        entries[_RA] = input[_RA];
    }
    if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    if (input[_T] != null) {
        const memberEntries = se_tagListType(input[_T], context);
        if (input[_T]?.length === 0) {
            entries.Tags = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `Tags.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_TTK] != null) {
        const memberEntries = se_tagKeyListType(input[_TTK], context);
        if (input[_TTK]?.length === 0) {
            entries.TransitiveTagKeys = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `TransitiveTagKeys.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_EI] != null) {
        entries[_EI] = input[_EI];
    }
    if (input[_SN] != null) {
        entries[_SN] = input[_SN];
    }
    if (input[_TC] != null) {
        entries[_TC] = input[_TC];
    }
    if (input[_SI] != null) {
        entries[_SI] = input[_SI];
    }
    if (input[_PC] != null) {
        const memberEntries = se_ProvidedContextsListType(input[_PC], context);
        if (input[_PC]?.length === 0) {
            entries.ProvidedContexts = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `ProvidedContexts.${key}`;
            entries[loc] = value;
        });
    }
    return entries;
};
const se_AssumeRoleWithSAMLRequest = (input, context) => {
    const entries = {};
    if (input[_RA] != null) {
        entries[_RA] = input[_RA];
    }
    if (input[_PAr] != null) {
        entries[_PAr] = input[_PAr];
    }
    if (input[_SAMLA] != null) {
        entries[_SAMLA] = input[_SAMLA];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    return entries;
};
const se_AssumeRoleWithWebIdentityRequest = (input, context) => {
    const entries = {};
    if (input[_RA] != null) {
        entries[_RA] = input[_RA];
    }
    if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
    }
    if (input[_WIT] != null) {
        entries[_WIT] = input[_WIT];
    }
    if (input[_PI] != null) {
        entries[_PI] = input[_PI];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    return entries;
};
const se_DecodeAuthorizationMessageRequest = (input, context) => {
    const entries = {};
    if (input[_EM] != null) {
        entries[_EM] = input[_EM];
    }
    return entries;
};
const se_GetAccessKeyInfoRequest = (input, context) => {
    const entries = {};
    if (input[_AKI] != null) {
        entries[_AKI] = input[_AKI];
    }
    return entries;
};
const se_GetCallerIdentityRequest = (input, context) => {
    const entries = {};
    return entries;
};
const se_GetFederationTokenRequest = (input, context) => {
    const entries = {};
    if (input[_N] != null) {
        entries[_N] = input[_N];
    }
    if (input[_P] != null) {
        entries[_P] = input[_P];
    }
    if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (input[_PA]?.length === 0) {
            entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `PolicyArns.${key}`;
            entries[loc] = value;
        });
    }
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    if (input[_T] != null) {
        const memberEntries = se_tagListType(input[_T], context);
        if (input[_T]?.length === 0) {
            entries.Tags = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
            const loc = `Tags.${key}`;
            entries[loc] = value;
        });
    }
    return entries;
};
const se_GetSessionTokenRequest = (input, context) => {
    const entries = {};
    if (input[_DS] != null) {
        entries[_DS] = input[_DS];
    }
    if (input[_SN] != null) {
        entries[_SN] = input[_SN];
    }
    if (input[_TC] != null) {
        entries[_TC] = input[_TC];
    }
    return entries;
};
const se_policyDescriptorListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_PolicyDescriptorType(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const se_PolicyDescriptorType = (input, context) => {
    const entries = {};
    if (input[_a] != null) {
        entries[_a] = input[_a];
    }
    return entries;
};
const se_ProvidedContext = (input, context) => {
    const entries = {};
    if (input[_PAro] != null) {
        entries[_PAro] = input[_PAro];
    }
    if (input[_CA] != null) {
        entries[_CA] = input[_CA];
    }
    return entries;
};
const se_ProvidedContextsListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_ProvidedContext(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const se_Tag = (input, context) => {
    const entries = {};
    if (input[_K] != null) {
        entries[_K] = input[_K];
    }
    if (input[_Va] != null) {
        entries[_Va] = input[_Va];
    }
    return entries;
};
const se_tagKeyListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        entries[`member.${counter}`] = entry;
        counter++;
    }
    return entries;
};
const se_tagListType = (input, context) => {
    const entries = {};
    let counter = 1;
    for (const entry of input) {
        if (entry === null) {
            continue;
        }
        const memberEntries = se_Tag(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
            entries[`member.${counter}.${key}`] = value;
        });
        counter++;
    }
    return entries;
};
const de_AssumedRoleUser = (output, context) => {
    const contents = {};
    if (output[_ARI] != null) {
        contents[_ARI] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_ARI]);
    }
    if (output[_Ar] != null) {
        contents[_Ar] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_Ar]);
    }
    return contents;
};
const de_AssumeRoleResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = (0,smithy_client_dist_es/* .strictParseInt32 */.xW)(output[_PPS]);
    }
    if (output[_SI] != null) {
        contents[_SI] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_SI]);
    }
    return contents;
};
const de_AssumeRoleWithSAMLResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = __strictParseInt32(output[_PPS]);
    }
    if (output[_S] != null) {
        contents[_S] = __expectString(output[_S]);
    }
    if (output[_ST] != null) {
        contents[_ST] = __expectString(output[_ST]);
    }
    if (output[_I] != null) {
        contents[_I] = __expectString(output[_I]);
    }
    if (output[_Au] != null) {
        contents[_Au] = __expectString(output[_Au]);
    }
    if (output[_NQ] != null) {
        contents[_NQ] = __expectString(output[_NQ]);
    }
    if (output[_SI] != null) {
        contents[_SI] = __expectString(output[_SI]);
    }
    return contents;
};
const de_AssumeRoleWithWebIdentityResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_SFWIT] != null) {
        contents[_SFWIT] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_SFWIT]);
    }
    if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = (0,smithy_client_dist_es/* .strictParseInt32 */.xW)(output[_PPS]);
    }
    if (output[_Pr] != null) {
        contents[_Pr] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_Pr]);
    }
    if (output[_Au] != null) {
        contents[_Au] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_Au]);
    }
    if (output[_SI] != null) {
        contents[_SI] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_SI]);
    }
    return contents;
};
const de_Credentials = (output, context) => {
    const contents = {};
    if (output[_AKI] != null) {
        contents[_AKI] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_AKI]);
    }
    if (output[_SAK] != null) {
        contents[_SAK] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_SAK]);
    }
    if (output[_STe] != null) {
        contents[_STe] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_STe]);
    }
    if (output[_E] != null) {
        contents[_E] = (0,smithy_client_dist_es/* .expectNonNull */.Y0)((0,smithy_client_dist_es/* .parseRfc3339DateTimeWithOffset */.t_)(output[_E]));
    }
    return contents;
};
const de_DecodeAuthorizationMessageResponse = (output, context) => {
    const contents = {};
    if (output[_DM] != null) {
        contents[_DM] = __expectString(output[_DM]);
    }
    return contents;
};
const de_ExpiredTokenException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_FederatedUser = (output, context) => {
    const contents = {};
    if (output[_FUI] != null) {
        contents[_FUI] = __expectString(output[_FUI]);
    }
    if (output[_Ar] != null) {
        contents[_Ar] = __expectString(output[_Ar]);
    }
    return contents;
};
const de_GetAccessKeyInfoResponse = (output, context) => {
    const contents = {};
    if (output[_Ac] != null) {
        contents[_Ac] = __expectString(output[_Ac]);
    }
    return contents;
};
const de_GetCallerIdentityResponse = (output, context) => {
    const contents = {};
    if (output[_UI] != null) {
        contents[_UI] = __expectString(output[_UI]);
    }
    if (output[_Ac] != null) {
        contents[_Ac] = __expectString(output[_Ac]);
    }
    if (output[_Ar] != null) {
        contents[_Ar] = __expectString(output[_Ar]);
    }
    return contents;
};
const de_GetFederationTokenResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    if (output[_FU] != null) {
        contents[_FU] = de_FederatedUser(output[_FU], context);
    }
    if (output[_PPS] != null) {
        contents[_PPS] = __strictParseInt32(output[_PPS]);
    }
    return contents;
};
const de_GetSessionTokenResponse = (output, context) => {
    const contents = {};
    if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
    }
    return contents;
};
const de_IDPCommunicationErrorException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_IDPRejectedClaimException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_InvalidAuthorizationMessageException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_InvalidIdentityTokenException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_MalformedPolicyDocumentException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_PackedPolicyTooLargeException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const de_RegionDisabledException = (output, context) => {
    const contents = {};
    if (output[_m] != null) {
        contents[_m] = (0,smithy_client_dist_es/* .expectString */.lK)(output[_m]);
    }
    return contents;
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});
const collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => context.utf8Encoder(body));
const throwDefaultError = (0,smithy_client_dist_es/* .withBaseException */.jr)(STSServiceException);
const buildHttpRpcRequest = async (context, headers, path, resolvedHostname, body) => {
    const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
    const contents = {
        protocol,
        hostname,
        port,
        method: "POST",
        path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
        headers,
    };
    if (resolvedHostname !== undefined) {
        contents.hostname = resolvedHostname;
    }
    if (body !== undefined) {
        contents.body = body;
    }
    return new protocol_http_dist_es/* .HttpRequest */.Kd(contents);
};
const SHARED_HEADERS = {
    "content-type": "application/x-www-form-urlencoded",
};
const _ = "2011-06-15";
const _A = "Action";
const _AKI = "AccessKeyId";
const _AR = "AssumeRole";
const _ARI = "AssumedRoleId";
const _ARU = "AssumedRoleUser";
const _ARWSAML = "AssumeRoleWithSAML";
const _ARWWI = "AssumeRoleWithWebIdentity";
const _Ac = "Account";
const _Ar = "Arn";
const _Au = "Audience";
const _C = "Credentials";
const _CA = "ContextAssertion";
const _DAM = "DecodeAuthorizationMessage";
const _DM = "DecodedMessage";
const _DS = "DurationSeconds";
const _E = "Expiration";
const _EI = "ExternalId";
const _EM = "EncodedMessage";
const _FU = "FederatedUser";
const _FUI = "FederatedUserId";
const _GAKI = "GetAccessKeyInfo";
const _GCI = "GetCallerIdentity";
const _GFT = "GetFederationToken";
const _GST = "GetSessionToken";
const _I = "Issuer";
const _K = "Key";
const _N = "Name";
const _NQ = "NameQualifier";
const _P = "Policy";
const _PA = "PolicyArns";
const _PAr = "PrincipalArn";
const _PAro = "ProviderArn";
const _PC = "ProvidedContexts";
const _PI = "ProviderId";
const _PPS = "PackedPolicySize";
const _Pr = "Provider";
const _RA = "RoleArn";
const _RSN = "RoleSessionName";
const _S = "Subject";
const _SAK = "SecretAccessKey";
const _SAMLA = "SAMLAssertion";
const _SFWIT = "SubjectFromWebIdentityToken";
const _SI = "SourceIdentity";
const _SN = "SerialNumber";
const _ST = "SubjectType";
const _STe = "SessionToken";
const _T = "Tags";
const _TC = "TokenCode";
const _TTK = "TransitiveTagKeys";
const _UI = "UserId";
const _V = "Version";
const _Va = "Value";
const _WIT = "WebIdentityToken";
const _a = "arn";
const _m = "message";
const buildFormUrlencodedString = (formEntries) => Object.entries(formEntries)
    .map(([key, value]) => (0,smithy_client_dist_es/* .extendedEncodeURIComponent */.$6)(key) + "=" + (0,smithy_client_dist_es/* .extendedEncodeURIComponent */.$6)(value))
    .join("&");
const loadQueryErrorCode = (output, data) => {
    if (data.Error?.Code !== undefined) {
        return data.Error.Code;
    }
    if (output.statusCode == 404) {
        return "NotFound";
    }
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/commands/AssumeRoleCommand.js







class AssumeRoleCommand extends smithy_client_dist_es/* .Command.classBuilder */.uB.classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,serdePlugin/* .getSerdePlugin */.TM)(config, this.serialize, this.deserialize),
        (0,dist_es/* .getEndpointPlugin */.rD)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRole", {})
    .n("STSClient", "AssumeRoleCommand")
    .f(void 0, AssumeRoleResponseFilterSensitiveLog)
    .ser(se_AssumeRoleCommand)
    .de(de_AssumeRoleCommand)
    .build() {
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/commands/AssumeRoleWithWebIdentityCommand.js







class AssumeRoleWithWebIdentityCommand extends smithy_client_dist_es/* .Command.classBuilder */.uB.classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,serdePlugin/* .getSerdePlugin */.TM)(config, this.serialize, this.deserialize),
        (0,dist_es/* .getEndpointPlugin */.rD)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {})
    .n("STSClient", "AssumeRoleWithWebIdentityCommand")
    .f(AssumeRoleWithWebIdentityRequestFilterSensitiveLog, AssumeRoleWithWebIdentityResponseFilterSensitiveLog)
    .ser(se_AssumeRoleWithWebIdentityCommand)
    .de(de_AssumeRoleWithWebIdentityCommand)
    .build() {
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/defaultStsRoleAssumers.js


const ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
const getAccountIdFromAssumedRoleUser = (assumedRoleUser) => {
    if (typeof assumedRoleUser?.Arn === "string") {
        const arnComponents = assumedRoleUser.Arn.split(":");
        if (arnComponents.length > 4 && arnComponents[4] !== "") {
            return arnComponents[4];
        }
    }
    return undefined;
};
const resolveRegion = async (_region, _parentRegion, credentialProviderLogger) => {
    const region = typeof _region === "function" ? await _region() : _region;
    const parentRegion = typeof _parentRegion === "function" ? await _parentRegion() : _parentRegion;
    credentialProviderLogger?.debug?.("@aws-sdk/client-sts::resolveRegion", "accepting first of:", `${region} (provider)`, `${parentRegion} (parent client)`, `${ASSUME_ROLE_DEFAULT_REGION} (STS default)`);
    return region ?? parentRegion ?? ASSUME_ROLE_DEFAULT_REGION;
};
const getDefaultRoleAssumer = (stsOptions, stsClientCtor) => {
    let stsClient;
    let closureSourceCreds;
    return async (sourceCreds, params) => {
        closureSourceCreds = sourceCreds;
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new stsClientCtor({
                credentialDefaultProvider: () => async () => closureSourceCreds,
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        return {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
    };
};
const getDefaultRoleAssumerWithWebIdentity = (stsOptions, stsClientCtor) => {
    let stsClient;
    return async (params) => {
        if (!stsClient) {
            const { logger = stsOptions?.parentClientConfig?.logger, region, requestHandler = stsOptions?.parentClientConfig?.requestHandler, credentialProviderLogger, } = stsOptions;
            const resolvedRegion = await resolveRegion(region, stsOptions?.parentClientConfig?.region, credentialProviderLogger);
            const isCompatibleRequestHandler = !isH2(requestHandler);
            stsClient = new stsClientCtor({
                region: resolvedRegion,
                requestHandler: isCompatibleRequestHandler ? requestHandler : undefined,
                logger: logger,
            });
        }
        const { Credentials, AssumedRoleUser } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
        if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
            throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser);
        return {
            accessKeyId: Credentials.AccessKeyId,
            secretAccessKey: Credentials.SecretAccessKey,
            sessionToken: Credentials.SessionToken,
            expiration: Credentials.Expiration,
            ...(Credentials.CredentialScope && { credentialScope: Credentials.CredentialScope }),
            ...(accountId && { accountId }),
        };
    };
};
const decorateDefaultCredentialProvider = (provider) => (input) => provider({
    roleAssumer: getDefaultRoleAssumer(input, input.stsClientCtor),
    roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input, input.stsClientCtor),
    ...input,
});
const isH2 = (requestHandler) => {
    return requestHandler?.metadata?.handlerProtocol === "h2";
};

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+middleware-host-header@3.649.0/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js
var middleware_host_header_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-host-header@3.649.0/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+middleware-logger@3.649.0/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js
var loggerMiddleware = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-logger@3.649.0/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+middleware-recursion-detection@3.649.0/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/index.js
var middleware_recursion_detection_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-recursion-detection@3.649.0/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.649.0/node_modules/@aws-sdk/middleware-user-agent/dist-es/index.js + 3 modules
var middleware_user_agent_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+middleware-user-agent@3.649.0/node_modules/@aws-sdk/middleware-user-agent/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+config-resolver@3.0.6/node_modules/@smithy/config-resolver/dist-es/index.js + 10 modules
var config_resolver_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+config-resolver@3.0.6/node_modules/@smithy/config-resolver/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+core@2.4.1/node_modules/@smithy/core/dist-es/index.js + 17 modules
var core_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@2.4.1/node_modules/@smithy/core/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-content-length@3.0.6/node_modules/@smithy/middleware-content-length/dist-es/index.js
var middleware_content_length_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-content-length@3.0.6/node_modules/@smithy/middleware-content-length/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-retry@3.0.16/node_modules/@smithy/middleware-retry/dist-es/index.js + 14 modules
var middleware_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@3.0.16/node_modules/@smithy/middleware-retry/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js
var resolveAwsSdkSigV4Config = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-middleware@3.0.4/node_modules/@smithy/util-middleware/dist-es/index.js + 2 modules
var util_middleware_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@3.0.4/node_modules/@smithy/util-middleware/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/auth/httpAuthSchemeProvider.js



const defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
        operation: (0,util_middleware_dist_es/* .getSmithyContext */.u)(context).operation,
        region: (await (0,util_middleware_dist_es/* .normalizeProvider */.t)(config.region)()) ||
            (() => {
                throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
            })(),
    };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
            name: "sts",
            region: authParameters.region,
        },
        propertiesExtractor: (config, context) => ({
            signingProperties: {
                config,
                context,
            },
        }),
    };
}
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
    return {
        schemeId: "smithy.api#noAuth",
    };
}
const defaultSTSHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "AssumeRoleWithSAML": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "AssumeRoleWithWebIdentity": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveStsAuthConfig = (input) => ({
    ...input,
    stsClientCtor: STSClient,
});
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = resolveStsAuthConfig(config);
    const config_1 = (0,resolveAwsSdkSigV4Config/* .resolveAwsSdkSigV4Config */.h)(config_0);
    return {
        ...config_1,
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/package.json
var package_namespaceObject = {"rE":"3.651.1"}
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js
var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js + 3 modules
var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-node@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+cli_ec8c1e092679d63c1d0f34cc3d71520c/node_modules/@aws-sdk/credential-provider-node/dist-es/index.js + 2 modules
var credential_provider_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+credential-provider-node@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+cli_ec8c1e092679d63c1d0f34cc3d71520c/node_modules/@aws-sdk/credential-provider-node/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.649.0/node_modules/@aws-sdk/util-user-agent-node/dist-es/index.js + 3 modules
var util_user_agent_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-user-agent-node@3.649.0/node_modules/@aws-sdk/util-user-agent-node/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+hash-node@3.0.4/node_modules/@smithy/hash-node/dist-es/index.js
var hash_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+hash-node@3.0.4/node_modules/@smithy/hash-node/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+node-config-provider@3.1.5/node_modules/@smithy/node-config-provider/dist-es/index.js + 5 modules
var node_config_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@3.1.5/node_modules/@smithy/node-config-provider/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+node-http-handler@3.2.0/node_modules/@smithy/node-http-handler/dist-es/index.js + 13 modules
var node_http_handler_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@3.2.0/node_modules/@smithy/node-http-handler/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-body-length-node@3.0.0/node_modules/@smithy/util-body-length-node/dist-es/index.js + 1 modules
var util_body_length_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-body-length-node@3.0.0/node_modules/@smithy/util-body-length-node/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-retry@3.0.4/node_modules/@smithy/util-retry/dist-es/index.js + 8 modules
var util_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-retry@3.0.4/node_modules/@smithy/util-retry/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+url-parser@3.0.4/node_modules/@smithy/url-parser/dist-es/index.js + 1 modules
var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@3.0.4/node_modules/@smithy/url-parser/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-base64@3.0.0/node_modules/@smithy/util-base64/dist-es/index.js + 2 modules
var util_base64_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-base64@3.0.0/node_modules/@smithy/util-base64/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-utf8@3.0.0/node_modules/@smithy/util-utf8/dist-es/index.js + 3 modules
var util_utf8_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-utf8@3.0.0/node_modules/@smithy/util-utf8/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.649.0/node_modules/@aws-sdk/util-endpoints/dist-es/index.js + 9 modules
var util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+util-endpoints@3.649.0/node_modules/@aws-sdk/util-endpoints/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-endpoints@2.1.0/node_modules/@smithy/util-endpoints/dist-es/index.js + 35 modules
var _smithy_util_endpoints_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-endpoints@2.1.0/node_modules/@smithy/util-endpoints/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/endpoint/ruleset.js
const F = "required", G = "type", H = "fn", I = "argv", J = "ref";
const a = false, b = true, c = "booleanEquals", d = "stringEquals", e = "sigv4", f = "sts", g = "us-east-1", h = "endpoint", i = "https://sts.{Region}.{PartitionResult#dnsSuffix}", j = "tree", k = "error", l = "getAttr", m = { [F]: false, [G]: "String" }, n = { [F]: true, "default": false, [G]: "Boolean" }, ruleset_o = { [J]: "Endpoint" }, p = { [H]: "isSet", [I]: [{ [J]: "Region" }] }, q = { [J]: "Region" }, r = { [H]: "aws.partition", [I]: [q], "assign": "PartitionResult" }, s = { [J]: "UseFIPS" }, ruleset_t = { [J]: "UseDualStack" }, u = { "url": "https://sts.amazonaws.com", "properties": { "authSchemes": [{ "name": e, "signingName": f, "signingRegion": g }] }, "headers": {} }, v = {}, w = { "conditions": [{ [H]: d, [I]: [q, "aws-global"] }], [h]: u, [G]: h }, x = { [H]: c, [I]: [s, true] }, y = { [H]: c, [I]: [ruleset_t, true] }, z = { [H]: l, [I]: [{ [J]: "PartitionResult" }, "supportsFIPS"] }, A = { [J]: "PartitionResult" }, B = { [H]: c, [I]: [true, { [H]: l, [I]: [A, "supportsDualStack"] }] }, C = [{ [H]: "isSet", [I]: [ruleset_o] }], D = [x], E = [y];
const _data = { version: "1.0", parameters: { Region: m, UseDualStack: n, UseFIPS: n, Endpoint: m, UseGlobalEndpoint: n }, rules: [{ conditions: [{ [H]: c, [I]: [{ [J]: "UseGlobalEndpoint" }, b] }, { [H]: "not", [I]: C }, p, r, { [H]: c, [I]: [s, a] }, { [H]: c, [I]: [ruleset_t, a] }], rules: [{ conditions: [{ [H]: d, [I]: [q, "ap-northeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-south-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-2"] }], endpoint: u, [G]: h }, w, { conditions: [{ [H]: d, [I]: [q, "ca-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-north-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-3"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "sa-east-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, g] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-east-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-2"] }], endpoint: u, [G]: h }, { endpoint: { url: i, properties: { authSchemes: [{ name: e, signingName: f, signingRegion: "{Region}" }] }, headers: v }, [G]: h }], [G]: j }, { conditions: C, rules: [{ conditions: D, error: "Invalid Configuration: FIPS and custom endpoint are not supported", [G]: k }, { conditions: E, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", [G]: k }, { endpoint: { url: ruleset_o, properties: v, headers: v }, [G]: h }], [G]: j }, { conditions: [p], rules: [{ conditions: [r], rules: [{ conditions: [x, y], rules: [{ conditions: [{ [H]: c, [I]: [b, z] }, B], rules: [{ endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", [G]: k }], [G]: j }, { conditions: D, rules: [{ conditions: [{ [H]: c, [I]: [z, b] }], rules: [{ conditions: [{ [H]: d, [I]: [{ [H]: l, [I]: [A, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://sts.{Region}.amazonaws.com", properties: v, headers: v }, [G]: h }, { endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS is enabled but this partition does not support FIPS", [G]: k }], [G]: j }, { conditions: E, rules: [{ conditions: [B], rules: [{ endpoint: { url: "https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "DualStack is enabled but this partition does not support DualStack", [G]: k }], [G]: j }, w, { endpoint: { url: i, properties: v, headers: v }, [G]: h }], [G]: j }], [G]: j }, { error: "Invalid Configuration: Missing Region", [G]: k }] };
const ruleSet = _data;

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/endpoint/endpointResolver.js



const cache = new _smithy_util_endpoints_dist_es/* .EndpointCache */.kS({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS", "UseGlobalEndpoint"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0,_smithy_util_endpoints_dist_es/* .resolveEndpoint */.sO)(ruleSet, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
_smithy_util_endpoints_dist_es/* .customEndpointFunctions.aws */.mw.aws = util_endpoints_dist_es/* .awsEndpointFunctions */.UF;

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/runtimeConfig.shared.js








const getRuntimeConfig = (config) => {
    return {
        apiVersion: "2011-06-15",
        base64Decoder: config?.base64Decoder ?? util_base64_dist_es/* .fromBase64 */.E,
        base64Encoder: config?.base64Encoder ?? util_base64_dist_es/* .toBase64 */.n,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSTSHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new AwsSdkSigV4Signer/* .AwsSdkSigV4Signer */.f2(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core_dist_es/* .NoAuthSigner */.mR(),
            },
        ],
        logger: config?.logger ?? new smithy_client_dist_es/* .NoOpLogger */.N4(),
        serviceId: config?.serviceId ?? "STS",
        urlParser: config?.urlParser ?? url_parser_dist_es/* .parseUrl */.D,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_dist_es/* .fromUtf8 */.ar,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_dist_es/* .toUtf8 */.Pq,
    };
};

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@3.0.16/node_modules/@smithy/util-defaults-mode-node/dist-es/index.js + 3 modules
var util_defaults_mode_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@3.0.16/node_modules/@smithy/util-defaults-mode-node/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/runtimeConfig.js
















const runtimeConfig_getRuntimeConfig = (config) => {
    (0,smithy_client_dist_es/* .emitWarningIfUnsupportedVersion */.I9)(process.version);
    const defaultsMode = (0,util_defaults_mode_node_dist_es/* .resolveDefaultsModeConfig */.I)(config);
    const defaultConfigProvider = () => defaultsMode().then(smithy_client_dist_es/* .loadConfigsForDefaultMode */.lT);
    const clientSharedValues = getRuntimeConfig(config);
    (0,emitWarningIfUnsupportedVersion/* .emitWarningIfUnsupportedVersion */.I)(process.version);
    return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_dist_es/* .calculateBodyLength */.n,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? credential_provider_node_dist_es/* .defaultProvider */.v6,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ??
            (0,util_user_agent_node_dist_es/* .defaultUserAgent */.mJ)({ serviceId: clientSharedValues.serviceId, clientVersion: package_namespaceObject.rE }),
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4") ||
                    (async (idProps) => await (0,credential_provider_node_dist_es/* .defaultProvider */.v6)(idProps?.__config || {})()),
                signer: new AwsSdkSigV4Signer/* .AwsSdkSigV4Signer */.f2(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core_dist_es/* .NoAuthSigner */.mR(),
            },
        ],
        maxAttempts: config?.maxAttempts ?? (0,node_config_provider_dist_es/* .loadConfig */.Z)(middleware_retry_dist_es/* .NODE_MAX_ATTEMPT_CONFIG_OPTIONS */.qs),
        region: config?.region ?? (0,node_config_provider_dist_es/* .loadConfig */.Z)(config_resolver_dist_es/* .NODE_REGION_CONFIG_OPTIONS */.GG, config_resolver_dist_es/* .NODE_REGION_CONFIG_FILE_OPTIONS */.zH),
        requestHandler: node_http_handler_dist_es/* .NodeHttpHandler.create */.$c.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ??
            (0,node_config_provider_dist_es/* .loadConfig */.Z)({
                ...middleware_retry_dist_es/* .NODE_RETRY_MODE_CONFIG_OPTIONS */.kN,
                default: async () => (await defaultConfigProvider()).retryMode || util_retry_dist_es/* .DEFAULT_RETRY_MODE */.L0,
            }),
        sha256: config?.sha256 ?? hash_node_dist_es/* .Hash.bind */.V.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_dist_es/* .streamCollector */.kv,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0,node_config_provider_dist_es/* .loadConfig */.Z)(config_resolver_dist_es/* .NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS */.e$),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0,node_config_provider_dist_es/* .loadConfig */.Z)(config_resolver_dist_es/* .NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS */.Ko),
    };
};

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+region-config-resolver@3.649.0/node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js
var dist_es_extensions = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+region-config-resolver@3.649.0/node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/auth/httpAuthExtensionConfiguration.js
const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/runtimeExtensions.js




const asPartial = (t) => t;
const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = {
        ...asPartial((0,dist_es_extensions/* .getAwsRegionExtensionConfiguration */.R)(runtimeConfig)),
        ...asPartial((0,smithy_client_dist_es/* .getDefaultExtensionConfiguration */.xA)(runtimeConfig)),
        ...asPartial((0,protocol_http_dist_es/* .getHttpHandlerExtensionConfiguration */.eS)(runtimeConfig)),
        ...asPartial(getHttpAuthExtensionConfiguration(runtimeConfig)),
    };
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return {
        ...runtimeConfig,
        ...(0,dist_es_extensions/* .resolveAwsRegionExtensionConfiguration */.$)(extensionConfiguration),
        ...(0,smithy_client_dist_es/* .resolveDefaultRuntimeConfig */.uv)(extensionConfiguration),
        ...(0,protocol_http_dist_es/* .resolveHttpHandlerRuntimeConfig */.jt)(extensionConfiguration),
        ...resolveHttpAuthRuntimeConfig(extensionConfiguration),
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/STSClient.js















class STSClient extends smithy_client_dist_es/* .Client */.Kj {
    constructor(...[configuration]) {
        const _config_0 = runtimeConfig_getRuntimeConfig(configuration || {});
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = (0,middleware_user_agent_dist_es/* .resolveUserAgentConfig */.Dc)(_config_1);
        const _config_3 = (0,middleware_retry_dist_es/* .resolveRetryConfig */.$z)(_config_2);
        const _config_4 = (0,config_resolver_dist_es/* .resolveRegionConfig */.TD)(_config_3);
        const _config_5 = (0,middleware_host_header_dist_es/* .resolveHostHeaderConfig */.OV)(_config_4);
        const _config_6 = (0,dist_es/* .resolveEndpointConfig */.Co)(_config_5);
        const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
        super(_config_8);
        this.config = _config_8;
        this.middlewareStack.use((0,middleware_user_agent_dist_es/* .getUserAgentPlugin */.sM)(this.config));
        this.middlewareStack.use((0,middleware_retry_dist_es/* .getRetryPlugin */.ey)(this.config));
        this.middlewareStack.use((0,middleware_content_length_dist_es/* .getContentLengthPlugin */.vK)(this.config));
        this.middlewareStack.use((0,middleware_host_header_dist_es/* .getHostHeaderPlugin */.TC)(this.config));
        this.middlewareStack.use((0,loggerMiddleware/* .getLoggerPlugin */.Y7)(this.config));
        this.middlewareStack.use((0,middleware_recursion_detection_dist_es/* .getRecursionDetectionPlugin */.n4)(this.config));
        this.middlewareStack.use((0,core_dist_es/* .getHttpAuthSchemeEndpointRuleSetPlugin */.wB)(this.config, {
            httpAuthSchemeParametersProvider: defaultSTSHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core_dist_es/* .DefaultIdentityProviderConfig */.h$({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use((0,core_dist_es/* .getHttpSigningPlugin */.lW)(this.config));
    }
    destroy() {
        super.destroy();
    }
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/defaultRoleAssumers.js


const getCustomizableStsClientCtor = (baseCtor, customizations) => {
    if (!customizations)
        return baseCtor;
    else
        return class CustomizableSTSClient extends baseCtor {
            constructor(config) {
                super(config);
                for (const customization of customizations) {
                    this.middlewareStack.use(customization);
                }
            }
        };
};
const defaultRoleAssumers_getDefaultRoleAssumer = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumer(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity = (stsOptions = {}, stsPlugins) => getDefaultRoleAssumerWithWebIdentity(stsOptions, getCustomizableStsClientCtor(STSClient, stsPlugins));
const defaultRoleAssumers_decorateDefaultCredentialProvider = (provider) => (input) => provider({
    roleAssumer: defaultRoleAssumers_getDefaultRoleAssumer(input),
    roleAssumerWithWebIdentity: defaultRoleAssumers_getDefaultRoleAssumerWithWebIdentity(input),
    ...input,
});

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sts@3.651.1/node_modules/@aws-sdk/client-sts/dist-es/index.js








},

};
;