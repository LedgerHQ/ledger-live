# NOTE: pin this to a real, pullable Cosmos Hub release. Verify the tag against
# https://github.com/cosmos/gaia/pkgs/container/gaia before relying on it. The
# version must be cosmos-sdk >= 0.47 so `gaiad genesis ...` sub-commands and
# `gaiad init --default-denom` exist (see coin-tester-gaiad/entrypoint.sh).
FROM --platform=linux/amd64 ghcr.io/cosmos/gaia:v25.1.0

USER root

# jq patches the feemarket genesis (its fee denom isn't covered by
# `init --default-denom`); wget backs the docker-compose healthcheck so the
# image is self-contained. gaia images are Alpine-based (apk); branch on apt-get
# so the image keeps building if upstream ever switches base.
RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache jq wget; \
    elif command -v apt-get >/dev/null 2>&1; then \
      apt-get update \
      && apt-get install -y --no-install-recommends jq wget ca-certificates \
      && rm -rf /var/lib/apt/lists/*; \
    else \
      echo "neither apk nor apt-get available in base image" >&2; exit 1; \
    fi

COPY coin-tester-gaiad/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# LCD (REST), Tendermint RPC, gRPC
EXPOSE 1317 26657 9090

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
