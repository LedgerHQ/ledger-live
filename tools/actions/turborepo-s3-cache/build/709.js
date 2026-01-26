"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ (function () {
  return typeof document === 'undefined'
    ? new (require('url'.replace('', '')).URL)('file:' + __filename).href
    : (document.currentScript && document.currentScript.src) ||
      new URL('main.js', document.baseURI).href;
})();
;
exports.ids = ["709"];
exports.modules = {
"../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  CG: () => (parseJsonErrorBody),
  Y2: () => (parseJsonBody),
  cJ: () => (loadRestJsonErrorCode)
});
/* import */ var _common__rspack_import_0 = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/common.js");

const parseJsonBody = (streamBody, context) => (0,_common__rspack_import_0/* .collectBodyString */.w)(streamBody, context).then((encoded) => {
    if (encoded.length) {
        try {
            return JSON.parse(encoded);
        }
        catch (e) {
            if (e?.name === "SyntaxError") {
                Object.defineProperty(e, "$responseBodyText", {
                    value: encoded,
                });
            }
            throw e;
        }
    }
    return {};
});
const parseJsonErrorBody = async (errorBody, context) => {
    const value = await parseJsonBody(errorBody, context);
    value.message = value.message ?? value.Message;
    return value;
};
const loadRestJsonErrorCode = (output, data) => {
    const findKey = (object, key) => Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
    const sanitizeErrorCode = (rawValue) => {
        let cleanValue = rawValue;
        if (typeof cleanValue === "number") {
            cleanValue = cleanValue.toString();
        }
        if (cleanValue.indexOf(",") >= 0) {
            cleanValue = cleanValue.split(",")[0];
        }
        if (cleanValue.indexOf(":") >= 0) {
            cleanValue = cleanValue.split(":")[0];
        }
        if (cleanValue.indexOf("#") >= 0) {
            cleanValue = cleanValue.split("#")[1];
        }
        return cleanValue;
    };
    const headerKey = findKey(output.headers, "x-amzn-errortype");
    if (headerKey !== undefined) {
        return sanitizeErrorCode(output.headers[headerKey]);
    }
    if (data.code !== undefined) {
        return sanitizeErrorCode(data.code);
    }
    if (data["__type"] !== undefined) {
        return sanitizeErrorCode(data["__type"]);
    }
};


},
"../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  SSOClient: () => (/* reexport */ SSOClient),
  GetRoleCredentialsCommand: () => (/* reexport */ GetRoleCredentialsCommand)
});

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-endpoint@3.1.1/node_modules/@smithy/middleware-endpoint/dist-es/index.js + 10 modules
var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-endpoint@3.1.1/node_modules/@smithy/middleware-endpoint/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-serde@3.0.4/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js + 2 modules
var serdePlugin = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-serde@3.0.4/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+smithy-client@3.3.0/node_modules/@smithy/smithy-client/dist-es/index.js + 23 modules
var smithy_client_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@3.3.0/node_modules/@smithy/smithy-client/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/endpoint/EndpointParameters.js
const resolveClientEndpointParameters = (options) => {
    return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "awsssoportal",
    };
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/models/SSOServiceException.js


class SSOServiceException extends smithy_client_dist_es/* .ServiceException */.TJ {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SSOServiceException.prototype);
    }
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/models/models_0.js


class InvalidRequestException extends SSOServiceException {
    constructor(opts) {
        super({
            name: "InvalidRequestException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidRequestException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidRequestException.prototype);
    }
}
class ResourceNotFoundException extends SSOServiceException {
    constructor(opts) {
        super({
            name: "ResourceNotFoundException",
            $fault: "client",
            ...opts,
        });
        this.name = "ResourceNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
class TooManyRequestsException extends SSOServiceException {
    constructor(opts) {
        super({
            name: "TooManyRequestsException",
            $fault: "client",
            ...opts,
        });
        this.name = "TooManyRequestsException";
        this.$fault = "client";
        Object.setPrototypeOf(this, TooManyRequestsException.prototype);
    }
}
class UnauthorizedException extends SSOServiceException {
    constructor(opts) {
        super({
            name: "UnauthorizedException",
            $fault: "client",
            ...opts,
        });
        this.name = "UnauthorizedException";
        this.$fault = "client";
        Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
}
const GetRoleCredentialsRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: smithy_client_dist_es/* .SENSITIVE_STRING */.$H }),
});
const RoleCredentialsFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.secretAccessKey && { secretAccessKey: smithy_client_dist_es/* .SENSITIVE_STRING */.$H }),
    ...(obj.sessionToken && { sessionToken: smithy_client_dist_es/* .SENSITIVE_STRING */.$H }),
});
const GetRoleCredentialsResponseFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.roleCredentials && { roleCredentials: RoleCredentialsFilterSensitiveLog(obj.roleCredentials) }),
});
const ListAccountRolesRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: SENSITIVE_STRING }),
});
const ListAccountsRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: SENSITIVE_STRING }),
});
const LogoutRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.accessToken && { accessToken: SENSITIVE_STRING }),
});

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js
var parseJsonBody = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+core@2.4.1/node_modules/@smithy/core/dist-es/index.js + 17 modules
var core_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@2.4.1/node_modules/@smithy/core/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/protocols/Aws_restJson1.js





const se_GetRoleCredentialsCommand = async (input, context) => {
    const b = (0,core_dist_es/* .requestBuilder */.lI)(input, context);
    const headers = (0,smithy_client_dist_es/* .map */.Tj)({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/federation/credentials");
    const query = (0,smithy_client_dist_es/* .map */.Tj)({
        [_rn]: [, (0,smithy_client_dist_es/* .expectNonNull */.Y0)(input[_rN], `roleName`)],
        [_ai]: [, (0,smithy_client_dist_es/* .expectNonNull */.Y0)(input[_aI], `accountId`)],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_ListAccountRolesCommand = async (input, context) => {
    const b = rb(input, context);
    const headers = map({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/assignment/roles");
    const query = map({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()],
        [_ai]: [, __expectNonNull(input[_aI], `accountId`)],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_ListAccountsCommand = async (input, context) => {
    const b = rb(input, context);
    const headers = map({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/assignment/accounts");
    const query = map({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()],
    });
    let body;
    b.m("GET").h(headers).q(query).b(body);
    return b.build();
};
const se_LogoutCommand = async (input, context) => {
    const b = rb(input, context);
    const headers = map({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT],
    });
    b.bp("/logout");
    let body;
    b.m("POST").h(headers).b(body);
    return b.build();
};
const de_GetRoleCredentialsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = (0,smithy_client_dist_es/* .map */.Tj)({
        $metadata: deserializeMetadata(output),
    });
    const data = (0,smithy_client_dist_es/* .expectNonNull */.Y0)((0,smithy_client_dist_es/* .expectObject */.Xk)(await (0,parseJsonBody/* .parseJsonBody */.Y2)(output.body, context)), "body");
    const doc = (0,smithy_client_dist_es/* .take */.s)(data, {
        roleCredentials: smithy_client_dist_es/* ._json */.Ss,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_ListAccountRolesCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    const doc = take(data, {
        nextToken: __expectString,
        roleList: _json,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_ListAccountsCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    const data = __expectNonNull(__expectObject(await parseBody(output.body, context)), "body");
    const doc = take(data, {
        accountList: _json,
        nextToken: __expectString,
    });
    Object.assign(contents, doc);
    return contents;
};
const de_LogoutCommand = async (output, context) => {
    if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
    }
    const contents = map({
        $metadata: deserializeMetadata(output),
    });
    await collectBody(output.body, context);
    return contents;
};
const de_CommandError = async (output, context) => {
    const parsedOutput = {
        ...output,
        body: await (0,parseJsonBody/* .parseJsonErrorBody */.CG)(output.body, context),
    };
    const errorCode = (0,parseJsonBody/* .loadRestJsonErrorCode */.cJ)(output, parsedOutput.body);
    switch (errorCode) {
        case "InvalidRequestException":
        case "com.amazonaws.sso#InvalidRequestException":
            throw await de_InvalidRequestExceptionRes(parsedOutput, context);
        case "ResourceNotFoundException":
        case "com.amazonaws.sso#ResourceNotFoundException":
            throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
        case "TooManyRequestsException":
        case "com.amazonaws.sso#TooManyRequestsException":
            throw await de_TooManyRequestsExceptionRes(parsedOutput, context);
        case "UnauthorizedException":
        case "com.amazonaws.sso#UnauthorizedException":
            throw await de_UnauthorizedExceptionRes(parsedOutput, context);
        default:
            const parsedBody = parsedOutput.body;
            return throwDefaultError({
                output,
                parsedBody,
                errorCode,
            });
    }
};
const throwDefaultError = (0,smithy_client_dist_es/* .withBaseException */.jr)(SSOServiceException);
const de_InvalidRequestExceptionRes = async (parsedOutput, context) => {
    const contents = (0,smithy_client_dist_es/* .map */.Tj)({});
    const data = parsedOutput.body;
    const doc = (0,smithy_client_dist_es/* .take */.s)(data, {
        message: smithy_client_dist_es/* .expectString */.lK,
    });
    Object.assign(contents, doc);
    const exception = new InvalidRequestException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, parsedOutput.body);
};
const de_ResourceNotFoundExceptionRes = async (parsedOutput, context) => {
    const contents = (0,smithy_client_dist_es/* .map */.Tj)({});
    const data = parsedOutput.body;
    const doc = (0,smithy_client_dist_es/* .take */.s)(data, {
        message: smithy_client_dist_es/* .expectString */.lK,
    });
    Object.assign(contents, doc);
    const exception = new ResourceNotFoundException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, parsedOutput.body);
};
const de_TooManyRequestsExceptionRes = async (parsedOutput, context) => {
    const contents = (0,smithy_client_dist_es/* .map */.Tj)({});
    const data = parsedOutput.body;
    const doc = (0,smithy_client_dist_es/* .take */.s)(data, {
        message: smithy_client_dist_es/* .expectString */.lK,
    });
    Object.assign(contents, doc);
    const exception = new TooManyRequestsException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, parsedOutput.body);
};
const de_UnauthorizedExceptionRes = async (parsedOutput, context) => {
    const contents = (0,smithy_client_dist_es/* .map */.Tj)({});
    const data = parsedOutput.body;
    const doc = (0,smithy_client_dist_es/* .take */.s)(data, {
        message: smithy_client_dist_es/* .expectString */.lK,
    });
    Object.assign(contents, doc);
    const exception = new UnauthorizedException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents,
    });
    return (0,smithy_client_dist_es/* .decorateServiceException */.Mw)(exception, parsedOutput.body);
};
const deserializeMetadata = (output) => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
});
const collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => context.utf8Encoder(body));
const isSerializableHeaderValue = (value) => value !== undefined &&
    value !== null &&
    value !== "" &&
    (!Object.getOwnPropertyNames(value).includes("length") || value.length != 0) &&
    (!Object.getOwnPropertyNames(value).includes("size") || value.size != 0);
const _aI = "accountId";
const _aT = "accessToken";
const _ai = "account_id";
const _mR = "maxResults";
const _mr = "max_result";
const _nT = "nextToken";
const _nt = "next_token";
const _rN = "roleName";
const _rn = "role_name";
const _xasbt = "x-amz-sso_bearer_token";

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/commands/GetRoleCredentialsCommand.js







class GetRoleCredentialsCommand extends smithy_client_dist_es/* .Command.classBuilder */.uB.classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [
        (0,serdePlugin/* .getSerdePlugin */.TM)(config, this.serialize, this.deserialize),
        (0,dist_es/* .getEndpointPlugin */.rD)(config, Command.getEndpointParameterInstructions()),
    ];
})
    .s("SWBPortalService", "GetRoleCredentials", {})
    .n("SSOClient", "GetRoleCredentialsCommand")
    .f(GetRoleCredentialsRequestFilterSensitiveLog, GetRoleCredentialsResponseFilterSensitiveLog)
    .ser(se_GetRoleCredentialsCommand)
    .de(de_GetRoleCredentialsCommand)
    .build() {
}

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
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-content-length@3.0.6/node_modules/@smithy/middleware-content-length/dist-es/index.js
var middleware_content_length_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-content-length@3.0.6/node_modules/@smithy/middleware-content-length/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+middleware-retry@3.0.16/node_modules/@smithy/middleware-retry/dist-es/index.js + 14 modules
var middleware_retry_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+middleware-retry@3.0.16/node_modules/@smithy/middleware-retry/dist-es/index.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js
var resolveAwsSdkSigV4Config = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js");
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-middleware@3.0.4/node_modules/@smithy/util-middleware/dist-es/index.js + 2 modules
var util_middleware_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-middleware@3.0.4/node_modules/@smithy/util-middleware/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/auth/httpAuthSchemeProvider.js


const defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
            name: "awsssoportal",
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
const defaultSSOHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "GetRoleCredentials": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "ListAccountRoles": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "ListAccounts": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        case "Logout": {
            options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = (0,resolveAwsSdkSigV4Config/* .resolveAwsSdkSigV4Config */.h)(config);
    return {
        ...config_0,
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/package.json
var package_namespaceObject = {"rE":"3.651.1"}
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js
var emitWarningIfUnsupportedVersion = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js");
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
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js + 3 modules
var AwsSdkSigV4Signer = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.651.1/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js");
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
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/endpoint/ruleset.js
const u = "required", v = "fn", w = "argv", x = "ref";
const a = true, ruleset_b = "isSet", c = "booleanEquals", d = "error", e = "endpoint", f = "tree", g = "PartitionResult", h = "getAttr", i = { [u]: false, "type": "String" }, j = { [u]: true, "default": false, "type": "Boolean" }, k = { [x]: "Endpoint" }, l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] }, m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] }, n = {}, ruleset_o = { [v]: h, [w]: [{ [x]: g }, "supportsFIPS"] }, p = { [x]: g }, q = { [v]: c, [w]: [true, { [v]: h, [w]: [p, "supportsDualStack"] }] }, r = [l], s = [m], ruleset_t = [{ [x]: "Region" }];
const _data = { version: "1.0", parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i }, rules: [{ conditions: [{ [v]: ruleset_b, [w]: [k] }], rules: [{ conditions: r, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: s, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: k, properties: n, headers: n }, type: e }], type: f }, { conditions: [{ [v]: ruleset_b, [w]: ruleset_t }], rules: [{ conditions: [{ [v]: "aws.partition", [w]: ruleset_t, assign: g }], rules: [{ conditions: [l, m], rules: [{ conditions: [{ [v]: c, [w]: [a, ruleset_o] }, q], rules: [{ endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: r, rules: [{ conditions: [{ [v]: c, [w]: [ruleset_o, a] }], rules: [{ conditions: [{ [v]: "stringEquals", [w]: [{ [v]: h, [w]: [p, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://portal.sso.{Region}.amazonaws.com", properties: n, headers: n }, type: e }, { endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: s, rules: [{ conditions: [q], rules: [{ endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
const ruleSet = _data;

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/endpoint/endpointResolver.js



const cache = new _smithy_util_endpoints_dist_es/* .EndpointCache */.kS({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0,_smithy_util_endpoints_dist_es/* .resolveEndpoint */.sO)(ruleSet, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
_smithy_util_endpoints_dist_es/* .customEndpointFunctions.aws */.mw.aws = util_endpoints_dist_es/* .awsEndpointFunctions */.UF;

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/runtimeConfig.shared.js








const getRuntimeConfig = (config) => {
    return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? util_base64_dist_es/* .fromBase64 */.E,
        base64Encoder: config?.base64Encoder ?? util_base64_dist_es/* .toBase64 */.n,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOHttpAuthSchemeProvider,
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
        serviceId: config?.serviceId ?? "SSO",
        urlParser: config?.urlParser ?? url_parser_dist_es/* .parseUrl */.D,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_dist_es/* .fromUtf8 */.ar,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_dist_es/* .toUtf8 */.Pq,
    };
};

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@3.0.16/node_modules/@smithy/util-defaults-mode-node/dist-es/index.js + 3 modules
var util_defaults_mode_node_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-defaults-mode-node@3.0.16/node_modules/@smithy/util-defaults-mode-node/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/runtimeConfig.js














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
        defaultUserAgentProvider: config?.defaultUserAgentProvider ??
            (0,util_user_agent_node_dist_es/* .defaultUserAgent */.mJ)({ serviceId: clientSharedValues.serviceId, clientVersion: package_namespaceObject.rE }),
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
// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+protocol-http@4.1.1/node_modules/@smithy/protocol-http/dist-es/index.js + 5 modules
var protocol_http_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@4.1.1/node_modules/@smithy/protocol-http/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/auth/httpAuthExtensionConfiguration.js
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

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/runtimeExtensions.js




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

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+client-sso@3.651.1/node_modules/@aws-sdk/client-sso/dist-es/SSOClient.js















class SSOClient extends smithy_client_dist_es/* .Client */.Kj {
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
            httpAuthSchemeParametersProvider: defaultSSOHttpAuthSchemeParametersProvider,
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

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@aws-sdk+credential-provider-sso@3.651.1_@aws-sdk+client-sso-oidc@3.651.1_@aws-sdk+client-sts@3.651.1_/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js




},

};
;