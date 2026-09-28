# Builds a `clarinet-cli` binary with the fixes below applied on top of a pinned
# `stx-labs/clarinet` commit (v3.24.1) -- see the package README for the full picture:
# 1. `bollard` (Clarinet's Docker-API client) 0.17 mis-parses some Docker Engine API responses as
#    empty JSON and breaks the postgres container boot. `bollard-fix.patch` bumps it to 0.18 (plus
#    the one call-site change that needs) and retries a postgres container that vanishes on start.
# 2. Deliberately NOT patched: the generated `Stacks.toml`'s `[burnchain].rpc_port` points at
#    `orchestrator_ingestion_port`. That is Clarinet's Bitcoin RPC proxy, not a typo: the
#    stacks-node reaches bitcoind through it, and Clarinet mines the next block whenever it relays a
#    miner's block-commit (`NotifyBitcoinTransactionProxied`). Redirecting it straight to bitcoind
#    stops Clarinet from mining at all.
# 3. Clarinet gives up waiting on the bitcoind container after ~15s (30 attempts * 500ms) and
#    treats that as fatal, tearing the whole devnet down -- too tight on a CI runner cold-pulling
#    the bitcoind image, verified reproducing there (never reproduces locally, where the image is
#    already cached).
# 4. The bitcoin-node container's `HostConfig.auto_remove` is hardcoded `true`, so a container that
#    crashes or never becomes ready is deleted by the Docker daemon the instant it exits -- before
#    `docker logs`/`docker inspect` can ever see it. Disabled permanently -- see
#    `bitcoin-node-no-autoremove.patch` and the README.
# 5. The bind-mounted bitcoin-node data directory is created on the host without adjusting its
#    permissions, so on a real Linux Docker host (unlike Docker Desktop for Mac) the container's
#    `user: "1000"` cannot write into it -- bitcoind crashes on boot. Fixed by
#    `bitcoin-node-datadir-permissions.patch` (chmod 777 right after creation).
# 6. When booting from the snapshot, the bitcoin snapshot is copied into the bind-mounted data
#    directory with a plain `docker cp`, which does not give the files an owner bitcoind (uid 1000)
#    can use. A Linux host enforces ownership, so bitcoind can't read its own settings.json and
#    exits (Docker Desktop doesn't enforce it, so it only fails on Linux). Fixed by
#    `bitcoin-node-snapshot-ownership.patch`: `chmod -R a+rwX` on the extracted snapshot before
#    the copy (the copy keeps mode bits). A chown after the copy races bitcoind, already running.
#    The same patch creates the destination with a blocking `mkdir -p` first: Clarinet's own mkdir
#    is a detached exec, and `docker cp` intermittently found no destination.
# Built locally/in CI rather than depending on an upstream release picking up any of these.
# Base image and nightly pinned (not `rust:1-bookworm` / plain `nightly`): both floated, so a moved
# image or nightly could break the build with no change on our side.
# RUST_TOOLCHAIN is the single source: `src/devnet.ts` reads this line for the local (non-Docker)
# build, and CI's clarinet cache key hashes this directory, so bumping it here rebuilds everywhere.
FROM rust:1.98.1-bookworm@sha256:93ce27a88655056a51dbdd8f5f2d7ddc071c7b0070fb288a37b5a285fc83971e AS builder

ARG RUST_TOOLCHAIN=nightly-2026-09-25
RUN rustup toolchain install ${RUST_TOOLCHAIN} && rustup default ${RUST_TOOLCHAIN}
RUN apt-get update \
  && apt-get install -y --no-install-recommends git pkg-config libssl-dev \
  && rm -rf /var/lib/apt/lists/*

# Pinned, not `main`/`master`: reproducibility, and this is the exact commit the fix was verified
# against.
ARG CLARINET_COMMIT=a83c93231fde5391912f88c98c4175b0f359a2ba
RUN git clone https://github.com/stx-labs/clarinet.git /src \
  && cd /src && git checkout ${CLARINET_COMMIT}

COPY bollard-fix.patch /tmp/bollard-fix.patch
RUN cd /src && git apply /tmp/bollard-fix.patch

COPY bitcoin-node-patience.patch /tmp/bitcoin-node-patience.patch
RUN cd /src && git apply /tmp/bitcoin-node-patience.patch

COPY bitcoin-node-no-autoremove.patch /tmp/bitcoin-node-no-autoremove.patch
RUN cd /src && git apply /tmp/bitcoin-node-no-autoremove.patch

COPY bitcoin-node-datadir-permissions.patch /tmp/bitcoin-node-datadir-permissions.patch
RUN cd /src && git apply /tmp/bitcoin-node-datadir-permissions.patch

COPY bitcoin-node-snapshot-ownership.patch /tmp/bitcoin-node-snapshot-ownership.patch
RUN cd /src && git apply /tmp/bitcoin-node-snapshot-ownership.patch

# Nightly because the previous Clarinet pin needed unstable features (`debug_closure_helpers`,
# `slice_as_array`) through a transitive `stacks-core` git dependency. v3.24.1 declares
# `channel = "stable"` in its own `rust-toolchain`, so a pinned stable toolchain would likely do too.
RUN cd /src && cargo +${RUST_TOOLCHAIN} build --release -p clarinet-cli

FROM debian:bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /src/target/release/clarinet /usr/local/bin/clarinet
ENTRYPOINT ["/usr/local/bin/clarinet"]
