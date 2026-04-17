FROM ghcr.io/foundry-rs/foundry:latest

# Set user to 'root' to install cURL
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

USER foundry
