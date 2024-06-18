FROM --platform=linux/amd64 node:20
WORKDIR /coin-tester
COPY . .

HEALTHCHECK --interval=10s --timeout=30s --start-period=5s --retries=10 CMD [ "curl", "-f", "http://127.0.0.1:8000", "-H", "Accept: application/json", "-d", '{"jsonrpc":"2.0","id":1, "method":"system_health"}' ]

RUN npm install -g @acala-network/chopsticks@latest

EXPOSE 8000

CMD ["chopsticks", "--endpoint", "wss://rpc.polkadot.io", "--config", "coin-tester-chopsticks.yml"]
