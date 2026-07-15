FROM --platform=linux/amd64 babylonlabs/babylond:v4.3.0

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
