# Builds a `clarinet-cli` binary with the fixes in `bollard-fix.patch` and
# `bitcoin-node-patience.patch` applied on top of a pinned `stx-labs/clarinet` commit -- see the
# package README's "Known limitations" for all three:
# 1. The published `ghcr.io/stx-labs/clarinet` image ships `bollard` 0.17, which mis-parses some
#    Docker Engine API responses as empty JSON and breaks the postgres container boot (reproduces
#    on native arm64 and, being an HTTP JSON-parsing bug unrelated to CPU architecture, is expected
#    to reproduce on amd64 too).
# 2. A genuine upstream bug: the generated `Stacks.toml`'s `[burnchain].rpc_port` is set from
#    `orchestrator_ingestion_port` (clarinet's own event-listener port) instead of
#    `bitcoin_node_rpc_port` (bitcoind's actual RPC port), so `stacks-node` tries to reach bitcoind
#    on the wrong port and its burnchain sync never progresses.
# 3. Clarinet gives up waiting on the bitcoind container after ~15s (30 attempts * 500ms) and
#    treats that as fatal, tearing the whole devnet down -- too tight on a CI runner cold-pulling
#    the bitcoind image, verified reproducing there (never reproduces locally, where the image is
#    already cached).
# Built locally/in CI rather than depending on an upstream release picking up any of these.
FROM rust:1-bookworm AS builder

RUN rustup toolchain install nightly && rustup default nightly
RUN apt-get update \
  && apt-get install -y --no-install-recommends git pkg-config libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Pinned, not `main`/`master`: reproducibility, and this is the exact commit the fix was verified
# against.
ARG CLARINET_COMMIT=4220f34773a20960ce955a6b76590c97751e8a60
RUN git clone https://github.com/stx-labs/clarinet.git /src \
  && cd /src && git checkout ${CLARINET_COMMIT}

COPY bollard-fix.patch /tmp/bollard-fix.patch
RUN cd /src && git apply /tmp/bollard-fix.patch

COPY bitcoin-node-patience.patch /tmp/bitcoin-node-patience.patch
RUN cd /src && git apply /tmp/bitcoin-node-patience.patch

# Nightly is required (not just installed defensively): a transitive `stacks-core`/`stacks-common`
# git dependency at this commit uses unstable features (`debug_closure_helpers`, `slice_as_array`)
# that don't compile on stable.
RUN cd /src && cargo +nightly build --release -p clarinet-cli

FROM debian:bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /src/target/release/clarinet /usr/local/bin/clarinet
ENTRYPOINT ["/usr/local/bin/clarinet"]
