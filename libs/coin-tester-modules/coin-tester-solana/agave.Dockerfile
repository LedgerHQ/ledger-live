# Anza doesn't publish Docker images for Agave 4.x, so install it here.
# Versions are pinned per cluster in docker-compose.yml.
ARG TARGETARCH

FROM debian:bookworm-slim@sha256:3783cc01769c7b2b1b83a5c5ad96c815348e28ed7da68e2e3687004faa906251 AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends bzip2 ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# amd64 (CI): official release
FROM base AS agave-amd64
ARG AGAVE_VERSION
ARG AGAVE_SHA256
RUN curl -sSfL -o /tmp/agave.tar.bz2 "https://release.anza.xyz/v${AGAVE_VERSION}/solana-release-x86_64-unknown-linux-gnu.tar.bz2" \
    && echo "${AGAVE_SHA256}  /tmp/agave.tar.bz2" | sha256sum -c - \
    && tar -xjf /tmp/agave.tar.bz2 -C /opt \
    && rm /tmp/agave.tar.bz2

# arm64 (Apple Silicon): Anza ships no Linux arm64 release and amd64 emulation lacks the io_uring Agave requires,
# so build from source. Slow the first time, cached afterwards.
FROM base AS build-arm64
ARG AGAVE_COMMIT
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential clang cmake git libclang-dev libprotobuf-dev libssl-dev libudev-dev llvm pkg-config protobuf-compiler zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /agave
RUN git init -q \
    && git fetch -q --depth 1 https://github.com/anza-xyz/agave.git "${AGAVE_COMMIT}" \
    && git checkout -q FETCH_HEAD
# some Agave versions run rustfmt from build scripts
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --component rustfmt \
    --default-toolchain "$(sed -n 's/^channel = "\(.*\)"/\1/p' rust-toolchain.toml)"
# LTO only speeds up the validator, not needed for tests and costly to link
RUN . /root/.cargo/env \
    && CARGO_PROFILE_RELEASE_LTO=off cargo build --release --bin solana-test-validator --bin solana \
    && mkdir -p /opt/solana-release/bin \
    && cp target/release/solana-test-validator target/release/solana /opt/solana-release/bin/

FROM base AS agave-arm64
COPY --from=build-arm64 /opt/solana-release /opt/solana-release

FROM agave-${TARGETARCH}
ENV PATH="/opt/solana-release/bin:${PATH}"
