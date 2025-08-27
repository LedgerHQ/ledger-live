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
    console.table(result);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
