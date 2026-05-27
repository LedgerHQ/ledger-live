# Lotus 2K devnet image — native ARM64 + AMD64 build
# Based on glifio/filecoin-docker pattern, simplified for local devnet use.
# Build: docker build -t lotus-2k-devnet .
# Expected build time: ~20-30 min (Rust FFI compilation)

FROM golang:1.25-bookworm AS build

ARG LOTUS_VERSION=v1.36.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        mesa-opencl-icd ocl-icd-opencl-dev \
        gcc git jq pkg-config curl clang \
        build-essential hwloc libhwloc-dev wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN git clone https://github.com/filecoin-project/lotus.git --depth 1 --branch ${LOTUS_VERSION} /lotus

WORKDIR /lotus
RUN make clean deps && make 2k

RUN install -C lotus /usr/local/bin/lotus && \
    install -C lotus-miner /usr/local/bin/lotus-miner && \
    install -C lotus-seed /usr/local/bin/lotus-seed && \
    install -C lotus-shed /usr/local/bin/lotus-shed

# --- Runtime ---
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libhwloc15 ocl-icd-libopencl1 ca-certificates jq curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build \
    /usr/local/bin/lotus \
    /usr/local/bin/lotus-miner \
    /usr/local/bin/lotus-seed \
    /usr/local/bin/lotus-shed \
    /usr/local/bin/

ENV LOTUS_PATH=/var/lib/lotus
ENV LOTUS_MINER_PATH=/var/lib/lotus-miner
ENV LOTUS_SKIP_GENESIS_CHECK=_yes_

EXPOSE 1234/tcp

CMD ["/bin/bash"]
