# A local Aleo chain, run by `leo devnode`.
#
# devnode embeds snarkVM's ledger in the leo binary itself: one process, no
# consensus, no p2p, and no snarkOS. That is what keeps this image to a plain
# binary download — `leo devnet` would instead need snarkOS built from source
# with `--features test_network` (~12 min on a cold cache), because every
# published snarkOS artifact ships without that feature and so refuses `--dev`.
FROM --platform=linux/amd64 debian:bookworm-slim AS builder

ARG LEO_VERSION=4.3.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

# The CLI ships under the `leo-lang` release tag; `leo-lsp` / `leo-fmt` are
# separate releases at the same version and are not the binary we want.
RUN mkdir -p /out/bin \
    && curl -fsSL -o /tmp/leo.zip \
        "https://github.com/ProvableHQ/leo/releases/download/leo-lang-v${LEO_VERSION}/leo-lang-v${LEO_VERSION}-x86_64-unknown-linux-musl.zip" \
    && unzip -j /tmp/leo.zip leo -d /out/bin \
    && chmod +x /out/bin/leo

FROM --platform=linux/amd64 debian:bookworm-slim

# curl backs the docker-compose healthcheck so the image is self-contained.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/bin/leo /usr/local/bin/leo

WORKDIR /aleo

EXPOSE 3030

# --socket-addr must bind 0.0.0.0: the default 127.0.0.1 is unreachable from
# outside the container. --private-key names the genesis account, which is
# devnode's only prefunded one and the key scenarios fund from.
CMD ["leo", "devnode", "start", "--disable-update-check", \
     "--socket-addr", "0.0.0.0:3030", \
     "--storage", "/aleo", "--clear-storage", "--verbosity", "1", \
     "--private-key", "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"]
