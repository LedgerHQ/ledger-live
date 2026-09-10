# Pinned to the multi-arch manifest LIST digest, deliberately WITHOUT a
# --platform flag, so each host builds for its own architecture: amd64 on CI
# runners, arm64 natively on Apple Silicon. Forcing linux/amd64 here (and the
# amd64-only image digest 9143d431…) made babylond run under emulation, where
# it dies instantly with SIGILL — container exit 132 — on an arm64 host.
# v4.3.0 publishes both linux/amd64 and linux/arm64; the list digest covers
# both and stays reproducible. Re-verify with:
#   docker buildx imagetools inspect babylonlabs/babylond:<tag>
FROM babylonlabs/babylond:v4.3.0@sha256:11cc4c98abe84940744d8ee0292ea1fc14c086e4029fbe905b5d14993318c13d

USER root

# jq patches genesis; bash runs the entrypoint (shebang #!/bin/bash + `set -o
# pipefail`, which busybox ash would break); wget backs the docker-compose
# healthcheck so the image is self-contained (not relying on the base's busybox
# applet).
# babylonlabs/babylond:v4.3.0 is Alpine-based (apk); branch on apt-get so the
# image keeps building if upstream ever switches base.
RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache jq bash wget; \
    elif command -v apt-get >/dev/null 2>&1; then \
      apt-get update \
      && apt-get install -y --no-install-recommends jq bash wget ca-certificates \
      && rm -rf /var/lib/apt/lists/*; \
    else \
      echo "neither apk nor apt-get available in base image" >&2; exit 1; \
    fi

COPY coin-tester-babylond/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# LCD (REST), Tendermint RPC, gRPC
EXPOSE 1317 26657 9090

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
