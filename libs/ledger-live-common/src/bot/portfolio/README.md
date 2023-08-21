## ledger live bot portfolio

The goal of ledger live bot sync is to orchestrate the synchronization of accounts of all the bots and to automate the measurements of performance as well of make a portfolio reporting of our assets in bots to see how to improve the coverage.

This is a headless end 2 end measurement of real accounts of the bots using speculos device to scan them.

### What kind of performance are tracked

- **sync times** (note that it depends on networking so it's not a precise metric, but gives a global idea)
- **cpu time** (how much time is lost by the CPU)
- **network bandwidth** (how much Mb of data has been downloaded)
- **network calls** (how much network calls a coin do & which are duplicated)
- **memory size of the JS** (how much RAM does the instance takes at the end)
- **account json size** (= how much the account will take in app.json – if we were not chunking the operations)
- **preload json size** (= the amount of data the coin stores in local storage of our apps. e.g erc20 data loaded, validators data,..)

### Limitations and known issues

- We are only measuring in context of Node.js (not web, not react-native)
- The coins are not modularized yet and therefore we can't have an accurate measurement of memory usage (the memory load will be huge for all coins) or of the "bundle" that a coin imply (which could be cool to achieve somehow)
- Don't trust the sync time that much as it depends on networking, however CPU time should be accurate.
- We only measure a full sync (initial scanning of accounts). We could measure one "incremental sync" per account to see if we manage to properly optimize this. that feels overkill for now.

### How does it work?

This works on two axes: across all bots and across all coins.

The logic of ledger-live is ran headlessly with Node.js and executes and measure the scanAccounts logic.
`process-main.ts` is the main orchestrator and it will spawn `process-sync.ts` processes for each coin to sync on.

The performance are retrieved using native Node.js functions like `cpuUsage` and `memoryUsage`. Each process is independently studied and even if there are some parallelisation at stake, the performance record shouldn't impact each other that much.

### What parameters does cli.ts takes?

The environment variables are similar to the bot:

- `SEED` and `SEED*`: all the process envs that starts with SEED will be considered as bots to use
- `COINAPPS`: the folder of the speculos device
- `SUMMARY`: a file where to store the summary report of the portfolio in a markdown format
- `REPORT_FOLDER`: a folder where structured reports will be stored
- `FILTER_CURRENCY`: a currency id to filter on (ex: `dogecoin`)
- `FILTER_FAMILY`: a family to filter on (ex: `bitcoin`)
