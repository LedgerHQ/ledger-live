# `leo devnode`, not `leo devnet`: published snarkOS lacks `test_network`, so devnet needs a ~12 min source build.
FROM --platform=linux/amd64 debian:bookworm-slim AS builder

# LEO_SHA256: musl asset `digest` at https://api.github.com/repos/ProvableHQ/leo/releases/tags/leo-lang-v<version>
ARG LEO_VERSION=4.3.4
ARG LEO_SHA256=e9d1366f758d67e9c0543a937cfc3441dc3664af5363dd0e8c79050a139b34a1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /out/bin \
    && curl -fsSL -o /tmp/leo.zip \
        "https://github.com/ProvableHQ/leo/releases/download/leo-lang-v${LEO_VERSION}/leo-lang-v${LEO_VERSION}-x86_64-unknown-linux-musl.zip" \
    && echo "${LEO_SHA256}  /tmp/leo.zip" | sha256sum -c - \
    && unzip -j /tmp/leo.zip leo -d /out/bin \
    && chmod +x /out/bin/leo

FROM --platform=linux/amd64 debian:bookworm-slim

# curl: docker-compose healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/bin/leo /usr/local/bin/leo

WORKDIR /aleo

EXPOSE 3030

# Genesis key: devnode's only prefunded account.
CMD ["leo", "devnode", "start", "--disable-update-check", \
     "--socket-addr", "0.0.0.0:3030", \
     "--storage", "/aleo", "--clear-storage", "--verbosity", "1", \
     "--private-key", "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"]
