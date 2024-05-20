FROM ubuntu:24.04
WORKDIR /coin-tester
COPY . .

# download wget
RUN  apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Download ./zombinet-linux-x64
RUN wget https://github.com/paritytech/zombienet/releases/download/v1.3.103/zombienet-linux-x64
RUN chmod +x ./zombienet-linux-x64
RUN yes | ./zombienet-linux-x64 --provider native setup all; exit 0

ENV RUST_BACKTRACE=1
ENV PATH="${PATH}:/coin-tester"

# Expose all ports defined in coin-tester.yml
EXPOSE 31323
EXPOSE 3003
EXPOSE 1998

CMD ["./zombienet-linux-x64", "spawn", "--provider", "native", "coin-tester-zombienet.toml"]
