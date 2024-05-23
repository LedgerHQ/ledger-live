FROM --platform=linux/amd64 node:20
WORKDIR /coin-tester
COPY . .

EXPOSE 8000

CMD ["npx", "--yes", "@acala-network/chopsticks@latest", "--endpoint", "wss://rpc.polkadot.io", "--config", "coin-tester-chopsticks.yml"]
