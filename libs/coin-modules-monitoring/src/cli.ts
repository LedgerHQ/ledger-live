import { Command } from "commander";
import currencies, { type AccountType } from "./currencies";
import run from "./run";

const VALID_ACCOUNT_TYPES = ["pristine", "average", "big"] as const;
const VALID_CURRENCIES = Object.keys(currencies);

function isValidAccountType(value: string): value is AccountType {
  return VALID_ACCOUNT_TYPES.includes(value as AccountType);
}

function validateAccountTypes(value: string): AccountType[] {
  const types = value.split(",").map(t => t.trim());
  const invalidTypes = types.filter(t => !isValidAccountType(t));

  if (types.some(t => !isValidAccountType(t))) {
    throw new Error(
      `Invalid account types: ${invalidTypes.join(", ")}. Valid types are: ${VALID_ACCOUNT_TYPES.join(", ")}`,
    );
  }

  return types.filter(isValidAccountType);
}

function validateCurrencies(value: string): string[] {
  const currencyList = value.split(",").map(c => c.trim());
  const invalidCurrencies = currencyList.filter(c => !VALID_CURRENCIES.includes(c));

  if (invalidCurrencies.length > 0) {
    throw new Error(
      `Invalid currencies: ${invalidCurrencies.join(", ")}. Valid currencies are: ${VALID_CURRENCIES.join(", ")}`,
    );
  }

  return currencyList;
}

const program = new Command();
program
  .name("coin-modules-monitoring")
  .description("Monitor cryptocurrency modules and push metrics to Datadog")
  .version("2.4.0");

program
  .command("monitor")
  .description("Monitor specified currencies and account types")
  .option(
    "-t, --account-types <types>",
    `comma-separated account types (${VALID_ACCOUNT_TYPES.join(", ")})`,
    "pristine,average,big",
  )
  .option(
    "-c, --currencies <currencies>",
    `comma-separated currencies (${VALID_CURRENCIES.slice(0, 5).join(", ")}...)`,
    "all",
  )
  .action(async options => {
    const accountTypes = validateAccountTypes(options.accountTypes);
    const filteredCurrencies =
      options.currencies === "all" ? VALID_CURRENCIES : validateCurrencies(options.currencies);

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

    try {
      const result = await run(monitoredCurrencies, accountTypes);
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
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
