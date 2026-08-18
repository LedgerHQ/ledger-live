FROM --platform=linux/amd64 node:lts-alpine@sha256:4ba75f835bb8802193e4c114572113d4b26f95f6f094f4b5229d2a77773e0afc
RUN apk add --no-cache curl
WORKDIR /coin-tester-polkadot
COPY . .

RUN npm install -g @acala-network/chopsticks@1.5.0

ENV CHOPSTICKS_CONFIG=/coin-tester-polkadot/coin-tester-chopsticks/polkadot.yml

EXPOSE 8000

CMD ["sh", "-lc", "chopsticks --config \"$CHOPSTICKS_CONFIG\" --port 8000"]
