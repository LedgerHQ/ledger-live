import { EventEmitter } from "node:events";
import commandLineArgs, { CommandLineOptions } from "command-line-args";
import packageJson from "../package.json";
import currencies, { type AccountType } from "./currencies";
import { buildJobs, runIsolated, validateConcurrency } from "./isolated";
import run from "./run";

// Mute `MaxListenersExceededWarning`
// TODO: check if emitters can be better handled
EventEmitter.defaultMaxListeners = 0;

const VALID_ACCOUNT_TYPES = ["pristine", "average", "big", "huge"] as const;
const VALID_CURRENCIES = Object.keys(currencies);

function isValidAccountType(value: string): value is AccountType {
  return VALID_ACCOUNT_TYPES.some(type => type === value);
}

function validateAccountTypes(value: string): AccountType[] {
  const types = value.split(",").map(t => t.trim());
  const invalidTypes = types.filter(t => !isValidAccountType(t));

  if (invalidTypes.length > 0) {
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

const mainOptionDefinitions = [
  { name: "command", defaultOption: true },
  { name: "help", alias: "h", type: Boolean },
  { name: "version", alias: "v", type: Boolean },
];

const monitorOptionDefinitions = [
  { name: "help", alias: "h", type: Boolean },
  {
    name: "account-types",
    alias: "t",
    type: String,
    defaultValue: "pristine,average,big",
  },
  {
    name: "currencies",
    alias: "c",
    type: String,
    defaultValue: "all",
  },
  {
    name: "isolated",
    alias: "i",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "concurrency",
    alias: "j",
    type: Number,
    defaultValue: Number(process.env.MONITOR_CONCURRENCY || 1),
  },
];

function printHelp() {
  console.log(`coin-modules-monitoring v${packageJson.version}`);
  console.log("Monitor cryptocurrency modules and push metrics to Datadog");
  console.log("");
  console.log("Usage: pnpm start <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  monitor                    Monitor specified currencies and account types");
  console.log("");
  console.log("Global Options:");
  console.log("  -h, --help                 Show help");
  console.log("  -v, --version              Show version");
  console.log("");
  console.log("Monitor Command Options:");
  console.log(
    `  -t, --account-types <types>  Comma-separated account types (${VALID_ACCOUNT_TYPES.join(", ")})`,
  );
  console.log("                             Default: pristine,average,big");
  console.log(
    `  -c, --currencies <currencies> Comma-separated currencies (${VALID_CURRENCIES.slice(0, 5).join(", ")}...)`,
  );
  console.log("                             Default: all");
  console.log(
    "  -i, --isolated             Run each currency/account combination in isolated processes",
  );
  console.log("                             Default: false (run in same process)");
  console.log(
    "  -j, --concurrency <n>      Number of isolated processes run in parallel (with --isolated)",
  );
  console.log("                             Default: $MONITOR_CONCURRENCY or 1");
  console.log("");
  console.log("Examples:");
  console.log("  pnpm start monitor");
  console.log("  pnpm start monitor -c bitcoin,ethereum -t pristine,average");
  console.log("  pnpm start monitor --currencies all --account-types big");
  console.log(
    "  pnpm start monitor --currencies bitcoin,etherem --account-types pristine,big --isolated",
  );
  console.log("  pnpm start monitor --account-types big,huge --isolated --concurrency 4");
}

function printVersion() {
  console.log(packageJson.version);
}

async function runMonitorCommand(options: CommandLineOptions) {
  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const accountTypes = validateAccountTypes(options["account-types"]);
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

  if (options.isolated) {
    // Only validated when used, so that a bad MONITOR_CONCURRENCY does not break a non-isolated run
    const concurrency = validateConcurrency(options.concurrency);
    const jobs = buildJobs(monitoredCurrencies, accountTypes);
    if (!jobs.length) {
      console.log("No account to monitor. Exit now.");
      process.exit(0);
    }
    console.log(`Monitoring ${jobs.length} process(es) with concurrency ${concurrency}`);
    process.exit((await runIsolated(jobs, concurrency)) ? 1 : 0);
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
}

const mainOptions = commandLineArgs(mainOptionDefinitions, {
  stopAtFirstUnknown: true,
});

if (mainOptions.version) {
  printVersion();
  process.exit(0);
}

if (mainOptions.help || !mainOptions.command) {
  printHelp();
  process.exit(0);
}

switch (mainOptions.command) {
  case "monitor": {
    const argv = mainOptions._unknown || [];
    const monitorOptions = commandLineArgs(monitorOptionDefinitions, { argv });
    runMonitorCommand(monitorOptions);
    break;
  }
  default:
    console.error(`Unknown command: ${mainOptions.command}`);
    console.error("Run 'pnpm start --help' for usage information.");
    process.exit(1);
}
