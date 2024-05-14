FROM --platform=linux/amd64 ubuntu:24.04
WORKDIR /coin-tester
COPY . .

# download wget
RUN  apt-get update
RUN apt-get install -y wget
RUN rm -rf /var/lib/apt/lists/*

# Download ./zombinet-linux-x64
RUN wget https://github.com/paritytech/zombienet/releases/download/v1.3.100/zombienet-linux-x64
RUN chmod +x ./zombienet-linux-x64
RUN ./zombienet-linux-x64 --provider native --yes setup polkadot; exit 0

ENV RUST_BACKTRACE=1
ENV PATH="${PATH}:/coin-tester"

# Expose all ports defined in coin-tester.yml
EXPOSE 31323
EXPOSE 3003
EXPOSE 1998

CMD ["./zombienet-linux-x64", "spawn", "--provider", "native", "coin-tester.toml"]
