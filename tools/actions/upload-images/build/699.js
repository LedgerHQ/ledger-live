"use strict";
exports.ids = [
    "699"
];
exports.modules = {
    "../../../node_modules/.pnpm/@aws-sdk+credential-provider-http@3.535.0/node_modules/@aws-sdk/credential-provider-http/dist-es/index.js" (__unused_rspack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            fromHttp: ()=>fromHttp
        });
        var dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+node-http-handler@2.5.0/node_modules/@smithy/node-http-handler/dist-es/index.js");
        var property_provider_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+property-provider@2.2.0/node_modules/@smithy/property-provider/dist-es/index.js");
        var promises_ = __webpack_require__("fs/promises");
        var promises_default = /*#__PURE__*/ __webpack_require__.n(promises_);
        const ECS_CONTAINER_HOST = "169.254.170.2";
        const EKS_CONTAINER_HOST_IPv4 = "169.254.170.23";
        const EKS_CONTAINER_HOST_IPv6 = "[fd00:ec2::23]";
        const checkUrl = (url)=>{
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
            throw new property_provider_dist_es.C1(`URL not accepted. It must either be HTTPS or match one of the following:
  - loopback CIDR 127.0.0.0/8 or [::1/128]
  - ECS container host 169.254.170.2
  - EKS container host 169.254.170.23 or [fd00:ec2::23]`);
        };
        var protocol_http_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+protocol-http@3.3.0/node_modules/@smithy/protocol-http/dist-es/index.js");
        var smithy_client_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+smithy-client@2.5.0/node_modules/@smithy/smithy-client/dist-es/index.js");
        var util_stream_dist_es = __webpack_require__("../../../node_modules/.pnpm/@smithy+util-stream@2.2.0/node_modules/@smithy/util-stream/dist-es/index.js");
        function createGetRequest(url) {
            return new protocol_http_dist_es.Kd({
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
        async function getCredentials(response) {
            const contentType = response?.headers["content-type"] ?? response?.headers["Content-Type"] ?? "";
            if (!contentType.includes("json")) console.warn("HTTP credential provider response header content-type was not application/json. Observed: " + contentType + ".");
            const stream = (0, util_stream_dist_es.c9)(response.body);
            const str = await stream.transformToString();
            if (200 === response.statusCode) {
                const parsed = JSON.parse(str);
                if ("string" != typeof parsed.AccessKeyId || "string" != typeof parsed.SecretAccessKey || "string" != typeof parsed.Token || "string" != typeof parsed.Expiration) throw new property_provider_dist_es.C1("HTTP credential provider response not of the required format, an object matching: { AccessKeyId: string, SecretAccessKey: string, Token: string, Expiration: string(rfc3339) }");
                return {
                    accessKeyId: parsed.AccessKeyId,
                    secretAccessKey: parsed.SecretAccessKey,
                    sessionToken: parsed.Token,
                    expiration: (0, smithy_client_dist_es.EI)(parsed.Expiration)
                };
            }
            if (response.statusCode >= 400 && response.statusCode < 500) {
                let parsedBody = {};
                try {
                    parsedBody = JSON.parse(str);
                } catch (e) {}
                throw Object.assign(new property_provider_dist_es.C1(`Server responded with status: ${response.statusCode}`), {
                    Code: parsedBody.Code,
                    Message: parsedBody.Message
                });
            }
            throw new property_provider_dist_es.C1(`Server responded with status: ${response.statusCode}`);
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
        const fromHttp = (options)=>{
            options.logger?.debug("@aws-sdk/credential-provider-http", "fromHttp");
            let host;
            const relative = options.awsContainerCredentialsRelativeUri ?? process.env[AWS_CONTAINER_CREDENTIALS_RELATIVE_URI];
            const full = options.awsContainerCredentialsFullUri ?? process.env[AWS_CONTAINER_CREDENTIALS_FULL_URI];
            const token = options.awsContainerAuthorizationToken ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN];
            const tokenFile = options.awsContainerAuthorizationTokenFile ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE];
            if (relative && full) {
                console.warn("AWS SDK HTTP credentials provider:", "you have set both awsContainerCredentialsRelativeUri and awsContainerCredentialsFullUri.");
                console.warn("awsContainerCredentialsFullUri will take precedence.");
            }
            if (token && tokenFile) {
                console.warn("AWS SDK HTTP credentials provider:", "you have set both awsContainerAuthorizationToken and awsContainerAuthorizationTokenFile.");
                console.warn("awsContainerAuthorizationToken will take precedence.");
            }
            if (full) host = full;
            else if (relative) host = `${DEFAULT_LINK_LOCAL_HOST}${relative}`;
            else throw new property_provider_dist_es.C1(`No HTTP credential provider host provided.
Set AWS_CONTAINER_CREDENTIALS_FULL_URI or AWS_CONTAINER_CREDENTIALS_RELATIVE_URI.`);
            const url = new URL(host);
            checkUrl(url);
            const requestHandler = new dist_es.$c({
                requestTimeout: options.timeout ?? 1000,
                connectionTimeout: options.timeout ?? 1000
            });
            return retryWrapper(async ()=>{
                const request = createGetRequest(url);
                if (token) request.headers.Authorization = token;
                else if (tokenFile) request.headers.Authorization = (await promises_default().readFile(tokenFile)).toString();
                try {
                    const result = await requestHandler.handle(request);
                    return getCredentials(result.response);
                } catch (e) {
                    throw new property_provider_dist_es.C1(String(e));
                }
            }, options.maxRetries ?? 3, options.timeout ?? 1000);
        };
    }
};
