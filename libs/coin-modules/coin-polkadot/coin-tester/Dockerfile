FROM --platform=linux/amd64 ubuntu:24.04
WORKDIR /coin-tester
COPY . .

# download wget
RUN  apt-get update
RUN apt-get install -y wget
RUN rm -rf /var/lib/apt/lists/*

RUN export PATH="/coin-tester:$PATH"

# Download ./zombinet-linux-x64
RUN wget https://github.com/paritytech/zombienet/releases/download/v1.3.100/zombienet-linux-x64
RUN chmod +x ./zombienet-linux-x64
RUN yes | ./zombienet-linux-x64 --provider native --force setup polkadot

CMD ["./zombienet-linux-x64", "spawn", "--provider", "native", "coin-tester.toml"]