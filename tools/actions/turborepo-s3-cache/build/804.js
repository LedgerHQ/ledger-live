"use strict";
const __rslib_import_meta_url__ = /*#__PURE__*/ (function () {
  return typeof document === 'undefined'
    ? new (require('url'.replace('', '')).URL)('file:' + __filename).href
    : (document.currentScript && document.currentScript.src) ||
      new URL('main.js', document.baseURI).href;
})();
;
exports.ids = ["804"];
exports.modules = {
"../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/index.js"(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  httpRequest: () => (/* reexport */ httpRequest),
  ENV_CMDS_FULL_URI: () => (/* reexport */ ENV_CMDS_FULL_URI),
  getInstanceMetadataEndpoint: () => (/* reexport */ getInstanceMetadataEndpoint),
  ENV_CMDS_RELATIVE_URI: () => (/* reexport */ ENV_CMDS_RELATIVE_URI),
  fromContainerMetadata: () => (/* reexport */ fromContainerMetadata),
  fromInstanceMetadata: () => (/* reexport */ fromInstanceMetadata)
});

// UNUSED EXPORTS: DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES, providerConfigFromInit, ENV_CMDS_AUTH_TOKEN, Endpoint

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js + 6 modules
var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@3.1.4/node_modules/@smithy/property-provider/dist-es/index.js");
// EXTERNAL MODULE: external "url"
var external_url_ = __webpack_require__("url");
// EXTERNAL MODULE: external "buffer"
var external_buffer_ = __webpack_require__("buffer");
// EXTERNAL MODULE: external "http"
var external_http_ = __webpack_require__("http");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/remoteProvider/httpRequest.js



function httpRequest(options) {
    return new Promise((resolve, reject) => {
        const req = (0,external_http_.request)({
            method: "GET",
            ...options,
            hostname: options.hostname?.replace(/^\[(.+)\]$/, "$1"),
        });
        req.on("error", (err) => {
            reject(Object.assign(new dist_es/* .ProviderError */.mZ("Unable to connect to instance metadata service"), err));
            req.destroy();
        });
        req.on("timeout", () => {
            reject(new dist_es/* .ProviderError */.mZ("TimeoutError from instance metadata service"));
            req.destroy();
        });
        req.on("response", (res) => {
            const { statusCode = 400 } = res;
            if (statusCode < 200 || 300 <= statusCode) {
                reject(Object.assign(new dist_es/* .ProviderError */.mZ("Error response received from instance metadata service"), { statusCode }));
                req.destroy();
            }
            const chunks = [];
            res.on("data", (chunk) => {
                chunks.push(chunk);
            });
            res.on("end", () => {
                resolve(external_buffer_.Buffer.concat(chunks));
                req.destroy();
            });
        });
        req.end();
    });
}

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/remoteProvider/ImdsCredentials.js
const isImdsCredentials = (arg) => Boolean(arg) &&
    typeof arg === "object" &&
    typeof arg.AccessKeyId === "string" &&
    typeof arg.SecretAccessKey === "string" &&
    typeof arg.Token === "string" &&
    typeof arg.Expiration === "string";
const fromImdsCredentials = (creds) => ({
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretAccessKey,
    sessionToken: creds.Token,
    expiration: new Date(creds.Expiration),
    ...(creds.AccountId && { accountId: creds.AccountId }),
});

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/remoteProvider/RemoteProviderInit.js
const DEFAULT_TIMEOUT = 1000;
const DEFAULT_MAX_RETRIES = 0;
const providerConfigFromInit = ({ maxRetries = DEFAULT_MAX_RETRIES, timeout = DEFAULT_TIMEOUT, }) => ({ maxRetries, timeout });

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/remoteProvider/retry.js
const retry = (toRetry, maxRetries) => {
    let promise = toRetry();
    for (let i = 0; i < maxRetries; i++) {
        promise = promise.catch(toRetry);
    }
    return promise;
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/fromContainerMetadata.js






const ENV_CMDS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
const ENV_CMDS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
const ENV_CMDS_AUTH_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
const fromContainerMetadata = (init = {}) => {
    const { timeout, maxRetries } = providerConfigFromInit(init);
    return () => retry(async () => {
        const requestOptions = await getCmdsUri({ logger: init.logger });
        const credsResponse = JSON.parse(await requestFromEcsImds(timeout, requestOptions));
        if (!isImdsCredentials(credsResponse)) {
            throw new dist_es/* .CredentialsProviderError */.C1("Invalid response received from instance metadata service.", {
                logger: init.logger,
            });
        }
        return fromImdsCredentials(credsResponse);
    }, maxRetries);
};
const requestFromEcsImds = async (timeout, options) => {
    if (process.env[ENV_CMDS_AUTH_TOKEN]) {
        options.headers = {
            ...options.headers,
            Authorization: process.env[ENV_CMDS_AUTH_TOKEN],
        };
    }
    const buffer = await httpRequest({
        ...options,
        timeout,
    });
    return buffer.toString();
};
const CMDS_IP = "169.254.170.2";
const GREENGRASS_HOSTS = {
    localhost: true,
    "127.0.0.1": true,
};
const GREENGRASS_PROTOCOLS = {
    "http:": true,
    "https:": true,
};
const getCmdsUri = async ({ logger }) => {
    if (process.env[ENV_CMDS_RELATIVE_URI]) {
        return {
            hostname: CMDS_IP,
            path: process.env[ENV_CMDS_RELATIVE_URI],
        };
    }
    if (process.env[ENV_CMDS_FULL_URI]) {
        const parsed = (0,external_url_.parse)(process.env[ENV_CMDS_FULL_URI]);
        if (!parsed.hostname || !(parsed.hostname in GREENGRASS_HOSTS)) {
            throw new dist_es/* .CredentialsProviderError */.C1(`${parsed.hostname} is not a valid container metadata service hostname`, {
                tryNextLink: false,
                logger,
            });
        }
        if (!parsed.protocol || !(parsed.protocol in GREENGRASS_PROTOCOLS)) {
            throw new dist_es/* .CredentialsProviderError */.C1(`${parsed.protocol} is not a valid container metadata service protocol`, {
                tryNextLink: false,
                logger,
            });
        }
        return {
            ...parsed,
            port: parsed.port ? parseInt(parsed.port, 10) : undefined,
        };
    }
    throw new dist_es/* .CredentialsProviderError */.C1("The container metadata credential provider cannot be used unless" +
        ` the ${ENV_CMDS_RELATIVE_URI} or ${ENV_CMDS_FULL_URI} environment` +
        " variable is set", {
        tryNextLink: false,
        logger,
    });
};

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+node-config-provider@3.1.5/node_modules/@smithy/node-config-provider/dist-es/index.js + 5 modules
var node_config_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-config-provider@3.1.5/node_modules/@smithy/node-config-provider/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/error/InstanceMetadataV1FallbackError.js

class InstanceMetadataV1FallbackError extends dist_es/* .CredentialsProviderError */.C1 {
    constructor(message, tryNextLink = true) {
        super(message, tryNextLink);
        this.tryNextLink = tryNextLink;
        this.name = "InstanceMetadataV1FallbackError";
        Object.setPrototypeOf(this, InstanceMetadataV1FallbackError.prototype);
    }
}

// EXTERNAL MODULE: ../../../node_modules/.pnpm/@smithy+url-parser@3.0.4/node_modules/@smithy/url-parser/dist-es/index.js + 1 modules
var url_parser_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+url-parser@3.0.4/node_modules/@smithy/url-parser/dist-es/index.js");
;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/config/Endpoint.js
var Endpoint_Endpoint;
(function (Endpoint) {
    Endpoint["IPv4"] = "http://169.254.169.254";
    Endpoint["IPv6"] = "http://[fd00:ec2::254]";
})(Endpoint_Endpoint || (Endpoint_Endpoint = {}));

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/config/EndpointConfigOptions.js
const ENV_ENDPOINT_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT";
const CONFIG_ENDPOINT_NAME = "ec2_metadata_service_endpoint";
const ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[ENV_ENDPOINT_NAME],
    configFileSelector: (profile) => profile[CONFIG_ENDPOINT_NAME],
    default: undefined,
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/config/EndpointMode.js
var EndpointMode_EndpointMode;
(function (EndpointMode) {
    EndpointMode["IPv4"] = "IPv4";
    EndpointMode["IPv6"] = "IPv6";
})(EndpointMode_EndpointMode || (EndpointMode_EndpointMode = {}));

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/config/EndpointModeConfigOptions.js

const ENV_ENDPOINT_MODE_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE";
const CONFIG_ENDPOINT_MODE_NAME = "ec2_metadata_service_endpoint_mode";
const ENDPOINT_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[ENV_ENDPOINT_MODE_NAME],
    configFileSelector: (profile) => profile[CONFIG_ENDPOINT_MODE_NAME],
    default: EndpointMode_EndpointMode.IPv4,
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/utils/getInstanceMetadataEndpoint.js






const getInstanceMetadataEndpoint = async () => (0,url_parser_dist_es/* .parseUrl */.D)((await getFromEndpointConfig()) || (await getFromEndpointModeConfig()));
const getFromEndpointConfig = async () => (0,node_config_provider_dist_es/* .loadConfig */.Z)(ENDPOINT_CONFIG_OPTIONS)();
const getFromEndpointModeConfig = async () => {
    const endpointMode = await (0,node_config_provider_dist_es/* .loadConfig */.Z)(ENDPOINT_MODE_CONFIG_OPTIONS)();
    switch (endpointMode) {
        case EndpointMode_EndpointMode.IPv4:
            return Endpoint_Endpoint.IPv4;
        case EndpointMode_EndpointMode.IPv6:
            return Endpoint_Endpoint.IPv6;
        default:
            throw new Error(`Unsupported endpoint mode: ${endpointMode}.` + ` Select from ${Object.values(EndpointMode_EndpointMode)}`);
    }
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/utils/getExtendedInstanceMetadataCredentials.js
const STATIC_STABILITY_REFRESH_INTERVAL_SECONDS = 5 * 60;
const STATIC_STABILITY_REFRESH_INTERVAL_JITTER_WINDOW_SECONDS = 5 * 60;
const STATIC_STABILITY_DOC_URL = "https://docs.aws.amazon.com/sdkref/latest/guide/feature-static-credentials.html";
const getExtendedInstanceMetadataCredentials = (credentials, logger) => {
    const refreshInterval = STATIC_STABILITY_REFRESH_INTERVAL_SECONDS +
        Math.floor(Math.random() * STATIC_STABILITY_REFRESH_INTERVAL_JITTER_WINDOW_SECONDS);
    const newExpiration = new Date(Date.now() + refreshInterval * 1000);
    logger.warn("Attempting credential expiration extension due to a credential service availability issue. A refresh of these " +
        `credentials will be attempted after ${new Date(newExpiration)}.\nFor more information, please visit: ` +
        STATIC_STABILITY_DOC_URL);
    const originalExpiration = credentials.originalExpiration ?? credentials.expiration;
    return {
        ...credentials,
        ...(originalExpiration ? { originalExpiration } : {}),
        expiration: newExpiration,
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/utils/staticStabilityProvider.js

const staticStabilityProvider = (provider, options = {}) => {
    const logger = options?.logger || console;
    let pastCredentials;
    return async () => {
        let credentials;
        try {
            credentials = await provider();
            if (credentials.expiration && credentials.expiration.getTime() < Date.now()) {
                credentials = getExtendedInstanceMetadataCredentials(credentials, logger);
            }
        }
        catch (e) {
            if (pastCredentials) {
                logger.warn("Credential renew failed: ", e);
                credentials = getExtendedInstanceMetadataCredentials(pastCredentials, logger);
            }
            else {
                throw e;
            }
        }
        pastCredentials = credentials;
        return credentials;
    };
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/fromInstanceMetadata.js









const IMDS_PATH = "/latest/meta-data/iam/security-credentials/";
const IMDS_TOKEN_PATH = "/latest/api/token";
const AWS_EC2_METADATA_V1_DISABLED = "AWS_EC2_METADATA_V1_DISABLED";
const PROFILE_AWS_EC2_METADATA_V1_DISABLED = "ec2_metadata_v1_disabled";
const X_AWS_EC2_METADATA_TOKEN = "x-aws-ec2-metadata-token";
const fromInstanceMetadata = (init = {}) => staticStabilityProvider(getInstanceMetadataProvider(init), { logger: init.logger });
const getInstanceMetadataProvider = (init = {}) => {
    let disableFetchToken = false;
    const { logger, profile } = init;
    const { timeout, maxRetries } = providerConfigFromInit(init);
    const getCredentials = async (maxRetries, options) => {
        const isImdsV1Fallback = disableFetchToken || options.headers?.[X_AWS_EC2_METADATA_TOKEN] == null;
        if (isImdsV1Fallback) {
            let fallbackBlockedFromProfile = false;
            let fallbackBlockedFromProcessEnv = false;
            const configValue = await (0,node_config_provider_dist_es/* .loadConfig */.Z)({
                environmentVariableSelector: (env) => {
                    const envValue = env[AWS_EC2_METADATA_V1_DISABLED];
                    fallbackBlockedFromProcessEnv = !!envValue && envValue !== "false";
                    if (envValue === undefined) {
                        throw new dist_es/* .CredentialsProviderError */.C1(`${AWS_EC2_METADATA_V1_DISABLED} not set in env, checking config file next.`, { logger: init.logger });
                    }
                    return fallbackBlockedFromProcessEnv;
                },
                configFileSelector: (profile) => {
                    const profileValue = profile[PROFILE_AWS_EC2_METADATA_V1_DISABLED];
                    fallbackBlockedFromProfile = !!profileValue && profileValue !== "false";
                    return fallbackBlockedFromProfile;
                },
                default: false,
            }, {
                profile,
            })();
            if (init.ec2MetadataV1Disabled || configValue) {
                const causes = [];
                if (init.ec2MetadataV1Disabled)
                    causes.push("credential provider initialization (runtime option ec2MetadataV1Disabled)");
                if (fallbackBlockedFromProfile)
                    causes.push(`config file profile (${PROFILE_AWS_EC2_METADATA_V1_DISABLED})`);
                if (fallbackBlockedFromProcessEnv)
                    causes.push(`process environment variable (${AWS_EC2_METADATA_V1_DISABLED})`);
                throw new InstanceMetadataV1FallbackError(`AWS EC2 Metadata v1 fallback has been blocked by AWS SDK configuration in the following: [${causes.join(", ")}].`);
            }
        }
        const imdsProfile = (await retry(async () => {
            let profile;
            try {
                profile = await getProfile(options);
            }
            catch (err) {
                if (err.statusCode === 401) {
                    disableFetchToken = false;
                }
                throw err;
            }
            return profile;
        }, maxRetries)).trim();
        return retry(async () => {
            let creds;
            try {
                creds = await getCredentialsFromProfile(imdsProfile, options, init);
            }
            catch (err) {
                if (err.statusCode === 401) {
                    disableFetchToken = false;
                }
                throw err;
            }
            return creds;
        }, maxRetries);
    };
    return async () => {
        const endpoint = await getInstanceMetadataEndpoint();
        if (disableFetchToken) {
            logger?.debug("AWS SDK Instance Metadata", "using v1 fallback (no token fetch)");
            return getCredentials(maxRetries, { ...endpoint, timeout });
        }
        else {
            let token;
            try {
                token = (await getMetadataToken({ ...endpoint, timeout })).toString();
            }
            catch (error) {
                if (error?.statusCode === 400) {
                    throw Object.assign(error, {
                        message: "EC2 Metadata token request returned error",
                    });
                }
                else if (error.message === "TimeoutError" || [403, 404, 405].includes(error.statusCode)) {
                    disableFetchToken = true;
                }
                logger?.debug("AWS SDK Instance Metadata", "using v1 fallback (initial)");
                return getCredentials(maxRetries, { ...endpoint, timeout });
            }
            return getCredentials(maxRetries, {
                ...endpoint,
                headers: {
                    [X_AWS_EC2_METADATA_TOKEN]: token,
                },
                timeout,
            });
        }
    };
};
const getMetadataToken = async (options) => httpRequest({
    ...options,
    path: IMDS_TOKEN_PATH,
    method: "PUT",
    headers: {
        "x-aws-ec2-metadata-token-ttl-seconds": "21600",
    },
});
const getProfile = async (options) => (await httpRequest({ ...options, path: IMDS_PATH })).toString();
const getCredentialsFromProfile = async (profile, options, init) => {
    const credentialsResponse = JSON.parse((await httpRequest({
        ...options,
        path: IMDS_PATH + profile,
    })).toString());
    if (!isImdsCredentials(credentialsResponse)) {
        throw new dist_es/* .CredentialsProviderError */.C1("Invalid response received from instance metadata service.", {
            logger: init.logger,
        });
    }
    return fromImdsCredentials(credentialsResponse);
};

;// CONCATENATED MODULE: ../../../node_modules/.pnpm/@smithy+credential-provider-imds@3.2.1/node_modules/@smithy/credential-provider-imds/dist-es/index.js









},

};
;