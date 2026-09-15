# Pinned to the digest verified when this file was written (product-science's
# published inferenced image, linux/amd64 only). Re-verify against
# https://github.com/product-science/inferenced/pkgs/container/inferenced if bumping.
FROM --platform=linux/amd64 ghcr.io/product-science/inferenced:0.2.0@sha256:b4e042a064936c0b8ec1345f71912164fde6e4b04601a8c50f099c00360744be

USER root

# Unlike gaia/babylond, this Alpine-derived image already ships jq (genesis
# patching) and wget (the busybox applet, backing the compose healthcheck) —
# no package install needed.

COPY coin-tester-inferenced/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# LCD (REST), Tendermint RPC, gRPC
EXPOSE 1317 26657 9090

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
