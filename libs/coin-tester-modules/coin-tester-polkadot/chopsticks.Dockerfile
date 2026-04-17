FROM --platform=linux/amd64 node:20
WORKDIR /coin-tester-polkadot
COPY . .

RUN npm install -g @acala-network/chopsticks@latest

ENV CHOPSTICKS_CONFIG=/coin-tester-chopsticks/polkadot.yml

EXPOSE 8000

CMD ["sh", "-lc", "chopsticks --config \"$CHOPSTICKS_CONFIG\" --port 8000"]
