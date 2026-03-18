# Coin evm

## Load testing

### What is k6
Open-source load testing tool; scripts are not Jest tests. You run them with the k6 CLI.

### Install
Link to [k6 installation](https://grafana.com/docs/k6/latest/set-up/install-k6/)

### How to run the load testing script
```sh
cd libs/coin-modules/coin-evm
RPC_URL="some node url" PAYLOAD="payload for the request" k6 run tools/load-testing/rpc-node.load.ts
```

Example
```sh
RPC_URL="https://api.zan.top/polygon-mainnet" PAYLOAD='[ { method: "eth_getBalance", params: ["0x66c4371ae8ffed2ec1c2ebbbccfb7e494181e1e3", "latest"], id: 3, jsonrpc: "2.0", }, { method: "eth_chainId", params: [], id: 4, jsonrpc: "2.0" }, ]' k6 run tools/load-testing/rpc-node.load.ts
```

You can find public node URL here [chainlist.org](https://chainlist.org/)

### What the script does
 It runs 100 requests per second for 10 seconds against an Ethereum-compatible JSON-RPC HTTP endpoint to observe rate limits / errors. The script targets at least one HTTP 429 error during the test.

# Important
This script is not part of the CI, it was added for testing purpose and resolve error rate on EVM
