FROM ghcr.io/foundry-rs/foundry:latest

# Set user to 'root' to install cURL
USER root

RUN apt install curl -y

USER foundry
