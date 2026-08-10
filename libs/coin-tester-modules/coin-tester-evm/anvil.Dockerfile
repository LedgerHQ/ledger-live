FROM ghcr.io/foundry-rs/foundry:latest@sha256:bdc584033cefab8be282c7f57c263cda42f04700cd1ec88d64bebe2f645aba72

# Set user to 'root' to install cURL
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

USER foundry
