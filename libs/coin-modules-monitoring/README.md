# @ledgerhq/coin-modules-monitoring

A monitoring tool that measures the performance of cryptocurrency modules in the Ledger Live ecosystem. It tracks scan and sync operations across different blockchain networks, measuring execution time, network calls, CPU usage, and memory consumption.

## 🎯 Purpose

This module helps the Ledger team monitor and optimize the performance of cryptocurrency integrations by:

- Measuring scan and sync operation durations
- Tracking network API calls and their distribution across domains
- Monitoring CPU and memory usage during operations
- Pushing metrics to Datadog for analysis and alerting

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Build Ledger Live Common
# (You need to be at the root of the LedgerLive project to run this command)
pnpm build:llc

# Build the project
pnpm build
```

## 🚀 Usage

### Basic Usage

Monitor specific currencies:

```bash
pnpm start monitor --currencies bitcoin,ethereum,solana --account-types pristine,average,big
```

Monitor all supported currencies on every account type:

```bash
pnpm start monitor
```

or

```bash
pnpm start monitor --currencies all --account-types pristine,average,big
```

Run monitoring in `isolated` mode

```bash
pnpm start monitor --currencies algorand --isolated
```

### Command Options

| Option                          | Description                                                                    | Default                   | Example                   |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------- | ------------------------- |
| `-c, --currencies <currencies>` | (Optional) Comma-separated list of currencies to monitor                       | `all`                     | `bitcoin,ethereum,solana` |
| `-t, --account-types <types>`   | (Optional) Comma-separated account types to test                               | `pristine,average,big`    | `pristine,big`            |
| `-i, --isolated`                | (Optional) Flag to run each currency/account combination in isolated processes | `false` (meaning no flag) | `--isolated` (for true)   |

### Account Types

The tool tests three different account types to measure performance across various scenarios:

- **`pristine`**: Accounts with a few transaction in history
- **`average`**: Accounts with moderate transaction in history
- **`big`**: Accounts with a lot of transactions in history

### Supported Currencies

The module supports the following cryptocurrencies:

- Algorand
- Aptos
- Bitcoin
- Casper
- Celo
- Cosmos
- Elrond
- Ethereum
- Filecoin
- Hedera
- Icon
- Internet_computer
- Mina
- Near
- Polkadot
- Ripple
- Solana
- Stellar
- Sui
- Tezos
- Tron
- Vechain

## 📊 Output

The tool provides detailed performance metrics:

```bash
[1 / 6] ✅ Completed in 2.3s
┌─ 🔎 Scan
│ • Calls: Total: 3 - api.etherscan.io: 2 - api.coingecko.com: 1
│ • CPU : min=0.1%, median=0.2%, max=0.5%, p90=0.4%, p99=0.5%
│ • MEM : min=45.2 MB, median=47.1 MB, max=48.9 MB, p90=48.5 MB, p99=48.8 MB
└─ 🔄 Sync
  • Calls: Total: 1 - api.etherscan.io: 1
  • CPU : min=0.0%, median=0.1%, max=0.2%, p90=0.2%, p99=0.2%
  • MEM : min=0 MB, median=0 MB, max=0 MB, p90=0 MB, p99=0 MB
```

## 🔧 Configuration

### Environment Variables

| Variable      | Description                              | Required | Default        |
| ------------- | ---------------------------------------- | -------- | -------------- |
| `DD_API_KEY`  | Datadog API key for metrics submission   | No       | -              |
| `DD_APP_KEY`  | Datadog application key                  | No       | -              |
| `DD_DOMAIN`   | Datadog site domain                      | No       | `datadoghq.eu` |
| `SUBMIT_LOGS` | Enable/disable log submission to Datadog | No       | -              |

### Datadog Integration

When `SUBMIT_LOGS` environment variable is set, the tool automatically submits performance metrics to Datadog with the following structure:

```json
{
  "duration": 1234,
  "currencyName": "ethereum",
  "coinModuleName": "ethereum",
  "operationType": "scan",
  "accountType": "average",
  "transactions": 42,
  "accountAddressOrXpub": "0x...",
  "totalNetworkCalls": 3,
  "networkCallsByDomain": {
    "api.etherscan.io": 2,
    "api.coingecko.com": 1
  },
  "cpu": { "min": 0.1, "median": 0.2, "max": 0.5, "p90": 0.4, "p99": 0.5 },
  "memory": { "min": 45.2, "median": 47.1, "max": 48.9, "p90": 48.5, "p99": 48.8 }
}
```

## 📈 Metrics Collected

### Performance Metrics

- **Duration**: Execution time for scan and sync operations in milliseconds
- **CPU Usage**: CPU consumption statistics (min, median, max, p90, p99)
- **Memory Usage**: Memory consumption in MB (min, median, max, p90, p99)

### Network Metrics

- **Total Network Calls**: Number of HTTP requests made
- **Calls by Domain**: Distribution of requests across different API endpoints

### Account Metrics

- **Transaction Count**: Number of transactions in the account
- **Account Type**: Type of account being tested (pristine/average/big)
- **Currency**: Blockchain network being tested
