"use strict";
exports.ids = [
    439
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-http@3.972.26/node_modules/@aws-sdk/credential-provider-http/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromHttp: ()=>fromHttp
        });
        var setCredentialFeature = __webpack_require__("../../../node_modules/.pnpm/@aws-sdk+core@3.973.26/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js");
        var node_http_handler = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@4.5.1/node_modules/@smithy/node-http-handler/dist-es/node-http-handler.js");
        var CredentialsProviderError = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@4.2.12/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js");
        var promises_ = __webpack_require__("node:fs/promises");
        var promises_default = /*#__PURE__*/ __webpack_require__.n(promises_);
        const ECS_CONTAINER_HOST = "169.254.170.2";
        const EKS_CONTAINER_HOST_IPv4 = "169.254.170.23";
        const EKS_CONTAINER_HOST_IPv6 = "[fd00:ec2::23]";
        const checkUrl = (url, logger)=>{
            if ("https:" === url.protocol) return;
            if (url.hostname === ECS_CONTAINER_HOST || url.hostname === EKS_CONTAINER_HOST_IPv4 || url.hostname === EKS_CONTAINER_HOST_IPv6) return;
            if (url.hostname.includes("[")) {
                if ("[::1]" === url.hostname || "[0000:0000:0000:0000:0000:0000:0000:0001]" === url.hostname) return;
            } else {
                if ("localhost" === url.hostname) return;
                const ipComponents = url.hostname.split(".");
                const inRange = (component)=>{
                    const num = parseInt(component, 10);
                    return 0 <= num && num <= 255;
                };
                if ("127" === ipComponents[0] && inRange(ipComponents[1]) && inRange(ipComponents[2]) && inRange(ipComponents[3]) && 4 === ipComponents.length) return;
            }
            throw new CredentialsProviderError.C(`URL not accepted. It must either be HTTPS or match one of the following:
  - loopback CIDR 127.0.0.0/8 or [::1/128]
  - ECS container host 169.254.170.2
  - EKS container host 169.254.170.23 or [fd00:ec2::23]`, {
                logger
            });
        };
        var httpRequest = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@5.3.12/node_modules/@smithy/protocol-http/dist-es/httpRequest.js");
        var date_utils = __webpack_require__("../../../node_modules/.pnpm/@smithy+core@3.23.13/node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js");
        var sdk_stream_mixin = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-stream@4.5.21/node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.js");
        function createGetRequest(url) {
            return new httpRequest.K({
                protocol: url.protocol,
                hostname: url.hostname,
                port: Number(url.port),
                path: url.pathname,
                query: Array.from(url.searchParams.entries()).reduce((acc, [k, v])=>{
                    acc[k] = v;
                    return acc;
                }, {}),
                fragment: url.hash
            });
        }
        async function getCredentials(response, logger) {
            const stream = (0, sdk_stream_mixin.c)(response.body);
            const str = await stream.transformToString();
            if (200 === response.statusCode) {
                const parsed = JSON.parse(str);
                if ("string" != typeof parsed.AccessKeyId || "string" != typeof parsed.SecretAccessKey || "string" != typeof parsed.Token || "string" != typeof parsed.Expiration) throw new CredentialsProviderError.C("HTTP credential provider response not of the required format, an object matching: { AccessKeyId: string, SecretAccessKey: string, Token: string, Expiration: string(rfc3339) }", {
                    logger
                });
                return {
                    accessKeyId: parsed.AccessKeyId,
                    secretAccessKey: parsed.SecretAccessKey,
                    sessionToken: parsed.Token,
                    expiration: (0, date_utils.EI)(parsed.Expiration)
                };
            }
            if (response.statusCode >= 400 && response.statusCode < 500) {
                let parsedBody = {};
                try {
                    parsedBody = JSON.parse(str);
                } catch (e) {}
                throw Object.assign(new CredentialsProviderError.C(`Server responded with status: ${response.statusCode}`, {
                    logger
                }), {
                    Code: parsedBody.Code,
                    Message: parsedBody.Message
                });
            }
            throw new CredentialsProviderError.C(`Server responded with status: ${response.statusCode}`, {
                logger
            });
        }
        const retryWrapper = (toRetry, maxRetries, delayMs)=>async ()=>{
                for(let i = 0; i < maxRetries; ++i)try {
                    return await toRetry();
                } catch (e) {
                    await new Promise((resolve)=>setTimeout(resolve, delayMs));
                }
                return await toRetry();
            };
        const AWS_CONTAINER_CREDENTIALS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
        const DEFAULT_LINK_LOCAL_HOST = "http://169.254.170.2";
        const AWS_CONTAINER_CREDENTIALS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
        const AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE = "AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE";
        const AWS_CONTAINER_AUTHORIZATION_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
        const fromHttp = (options = {})=>{
            options.logger?.debug("@aws-sdk/credential-provider-http - fromHttp");
            let host;
            const relative = options.awsContainerCredentialsRelativeUri ?? process.env[AWS_CONTAINER_CREDENTIALS_RELATIVE_URI];
            const full = options.awsContainerCredentialsFullUri ?? process.env[AWS_CONTAINER_CREDENTIALS_FULL_URI];
            const token = options.awsContainerAuthorizationToken ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN];
            const tokenFile = options.awsContainerAuthorizationTokenFile ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE];
            const warn = options.logger?.constructor?.name !== "NoOpLogger" && options.logger?.warn ? options.logger.warn.bind(options.logger) : console.warn;
            if (relative && full) {
                warn("@aws-sdk/credential-provider-http: you have set both awsContainerCredentialsRelativeUri and awsContainerCredentialsFullUri.");
                warn("awsContainerCredentialsFullUri will take precedence.");
            }
            if (token && tokenFile) {
                warn("@aws-sdk/credential-provider-http: you have set both awsContainerAuthorizationToken and awsContainerAuthorizationTokenFile.");
                warn("awsContainerAuthorizationToken will take precedence.");
            }
            if (full) host = full;
            else if (relative) host = `${DEFAULT_LINK_LOCAL_HOST}${relative}`;
            else throw new CredentialsProviderError.C(`No HTTP credential provider host provided.
Set AWS_CONTAINER_CREDENTIALS_FULL_URI or AWS_CONTAINER_CREDENTIALS_RELATIVE_URI.`, {
                logger: options.logger
            });
            const url = new URL(host);
            checkUrl(url, options.logger);
            const requestHandler = node_http_handler.$.create({
                requestTimeout: options.timeout ?? 1000,
                connectionTimeout: options.timeout ?? 1000
            });
            return retryWrapper(async ()=>{
                const request = createGetRequest(url);
                if (token) request.headers.Authorization = token;
                else if (tokenFile) request.headers.Authorization = (await promises_default().readFile(tokenFile)).toString();
                try {
                    const result = await requestHandler.handle(request);
                    return getCredentials(result.response).then((creds)=>(0, setCredentialFeature.g)(creds, "CREDENTIALS_HTTP", "z"));
                } catch (e) {
                    throw new CredentialsProviderError.C(String(e), {
                        logger: options.logger
                    });
                }
            }, options.maxRetries ?? 3, options.timeout ?? 1000);
        };
    }
};
