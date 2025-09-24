import currencies from "./currencies";
import run from "./run";

const [, , argv2 = "all"] = process.argv;
const supportedCurrencies = Object.keys(currencies);
const filteredCurrencies =
  argv2 === "all"
    ? supportedCurrencies
    : argv2
        .split(",")
        .map(c => c.trim())
        .filter(c => supportedCurrencies.includes(c));
const monitoredCurrencies = filteredCurrencies.filter(c => {
  const currency = currencies[c];
  if (currency?.skip) {
    console.log(`Skipping "${c}". Reason: ${currency.skip}`);
  }
  return !currency.skip;
});

if (!monitoredCurrencies.length) {
  console.log("No currencies to monitor. Exit now.");
  process.exit(0);
}

run(monitoredCurrencies)
  .then(result => {
    if (!result.entries.length) {
      console.log("No resulted entries. Exit now.");
    } else {
      console.log("========== SUMMARY ========== \n");
      console.table(
        result.entries.map(log => ({
          address: log.accountAddressOrXpub,
          type: log.accountType,
          transactions: log.transactions,
          currency: log.currencyName,
          module: log.coinModuleName,
          operation: log.operationType,
          "duration (ms)": log.duration,
          "network calls": log.totalNetworkCalls,
        })),
      );
    }
    process.exit(result.failed ? 1 : 0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
