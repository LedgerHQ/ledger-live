import accounts from "./accounts";
import run from "./run";

const [, , argv2 = "all"] = process.argv;
const supportedCurrencies = Object.keys(accounts);
const currencies =
  argv2 === "all"
    ? supportedCurrencies
    : argv2.split(",").filter(c => supportedCurrencies.includes(c));

run(currencies).then(console.table).catch(console.error);
