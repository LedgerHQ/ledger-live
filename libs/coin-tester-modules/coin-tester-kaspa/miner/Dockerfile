# Downloads the official kaspa WASM SDK (nodejs/kaspa-dev) from the rusty-kaspa v2.0.1 release.
# The SDK is ~32 MB; Docker caches the layer after the first build.
FROM node:22-alpine AS sdk-downloader
RUN apk add --no-cache curl unzip
RUN curl -sL \
    https://github.com/kaspanet/rusty-kaspa/releases/download/v2.0.1/kaspa-wasm32-sdk-v2.0.1.zip \
    -o /tmp/sdk.zip && \
    unzip -q /tmp/sdk.zip 'kaspa-wasm32-sdk/nodejs/kaspa-dev/*' -d /tmp/ && \
    mv /tmp/kaspa-wasm32-sdk/nodejs/kaspa-dev /kaspa

# node:22 provides globalThis.WebSocket natively (stable since v22, experimental in v21,
# absent in v20). The kaspa WASM RpcClient checks for this global at construction time;
# without it the module panics immediately.
FROM node:22-alpine
WORKDIR /app
COPY --from=sdk-downloader /kaspa /app/kaspa
COPY miner.js .
CMD ["node", "miner.js"]
