# Downloads the official kaspa WASM SDK (nodejs/kaspa-dev) from the rusty-kaspa v2.0.1 release.
# The SDK is ~32 MB; Docker caches the layer after the first build. kaspanet/rusty-kaspa doesn't
# publish an official checksum for this release, so SDK_SHA256 below is self-pinned (computed and
# verified against this exact asset when it was vetted) rather than sourced from upstream — the
# point is to catch the asset changing under this URL later, not to trust a third-party checksum.
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS sdk-downloader
ARG SDK_SHA256=7eaffac9cd920ef2fdf540c6e10f2a2b7761170ebc62ec57dfa0f71c64567a71
RUN apk add --no-cache curl unzip
RUN curl -sL \
    https://github.com/kaspanet/rusty-kaspa/releases/download/v2.0.1/kaspa-wasm32-sdk-v2.0.1.zip \
    -o /tmp/sdk.zip && \
    echo "${SDK_SHA256}  /tmp/sdk.zip" | sha256sum -c - && \
    unzip -q /tmp/sdk.zip 'kaspa-wasm32-sdk/nodejs/kaspa-dev/*' -d /tmp/ && \
    mv /tmp/kaspa-wasm32-sdk/nodejs/kaspa-dev /kaspa

# node:22 provides globalThis.WebSocket natively (stable since v22, experimental in v21,
# absent in v20). The kaspa WASM RpcClient checks for this global at construction time;
# without it the module panics immediately.
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32
WORKDIR /app
COPY --from=sdk-downloader /kaspa /app/kaspa
COPY miner.js .
CMD ["node", "miner.js"]
