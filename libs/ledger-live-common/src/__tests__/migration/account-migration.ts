/* eslint-disable no-console */
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import childProcess from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { promisify } from "util";
import { argv } from "yargs";

import { firstValueFrom, reduce } from "rxjs";
import { encodeAccountId, fromAccountRaw, toAccountRaw } from "../../account";
import { getAccountBridgeByFamily, getCurrencyBridge } from "../../bridge/impl";
import { liveConfig } from "../../config/sharedConfig";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "../../currencies";
import { MigrationAddress, migrationAddresses as defaultAddresses } from "./addresses";

// mandatory to run the script
setSupportedCurrencies([
  "bitcoin",
  "ethereum",
  "bsc",
  "polkadot",
  "ripple",
  "litecoin",
  "polygon",
  "bitcoin_cash",
  "stellar",
  "dogecoin",
  "cosmos",
  "dash",
  "tron",
  "tezos",
  "elrond",
  "ethereum_classic",
  "zcash",
  "decred",
  "digibyte",
  "algorand",
  "avalanche_c_chain",
  "qtum",
  "bitcoin_gold",
  "komodo",
  "zencash",
  "crypto_org",
  "crypto_org_cosmos",
  "crypto_org_croeseid",
  "celo",
  "hedera",
  "cardano",
  "solana",
  "osmosis",
  "fantom",
  "moonbeam",
  "cronos",
  "songbird",
  "flare",
  "near",
  "optimism",
  "arbitrum",
  "rsk",
  "bittorrent",
  "energy_web",
  "astar",
  "metis",
  "boba",
  "moonriver",
  "velas_evm",
  "syscoin",
  "axelar",
  "stargaze",
  "secret_network",
  "umee",
  "desmos",
  "dydx",
  "onomy",
  "sei_network",
  "persistence",
  "quicksilver",
  "vechain",
  "internet_computer",
  "klaytn",
  "polygon_zk_evm",
  "base",
  "base_sepolia",
  "stacks",
  "telos_evm",
  "coreum",
  "injective",
  "casper",
  "neon_evm",
  "lukso",
  "filecoin",
  "linea",
  "ton",
]);

LiveConfig.setConfig(liveConfig);
LiveConfig.setAppinfo({
  environment: "ci",
  platform: "headless-linux",
});

const args = argv;

type Args = {
  /**
   * comma seperated currencyIds
   * eg: --currencies ethereum,polygon,bitcoin
   */
  currencies?: CryptoCurrencyId;
  /**
   * absolute path for the output folder for the json file
   * eg: --outputFolderPath ~/outputs/
   */
  outputFolderPath?: string;
  /**
   * absolute path for the input json file
   * must only contain an array of raw accounts
   * eg: --inputFile ./rawAccounts/2d3fds.json
   */
  inputFile?: string;
  /**
   * if set, no output file will be created
   * eg: --noEmit
   */
  noEmit?: boolean;
};

const { currencies, inputFile, noEmit, outputFolderPath } = args as Args;

const getMockAccount = (currencyId: string, address: string): Account => {
  const currency = getCryptoCurrencyById(currencyId);

  return {
    type: "Account",
    id: encodeAccountId({
      type: "js",
      version: "",
      currencyId: currencyId,
      xpubOrAddress: address,
      derivationMode: "",
    }),
    freshAddress: address,
    xpub: address,
    derivationMode: "",
    operations: [],
    currency,
    creationDate: new Date(0),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 0,
    freshAddressPath: "",
    seedIdentifier: "",
    index: 0,
    used: true,
    operationsCount: 0,
    pendingOperations: [],
    lastSyncDate: new Date(0),
    balanceHistoryCache: {
      HOUR: { latestDate: 0, balances: [] },
      DAY: { latestDate: 0, balances: [] },
      WEEK: { latestDate: 0, balances: [] },
    },
    swapHistory: [],
  };
};

const testSync = async (currencyId: string, xpubOrAddress: string) => {
  console.log("starting sync on", currencyId, xpubOrAddress);
  const mockAccount = getMockAccount(currencyId, xpubOrAddress);
  const currency = getCryptoCurrencyById(currencyId);
  const currencyBrige = getCurrencyBridge(currency);
  const data = await currencyBrige.preload(currency);
  currencyBrige.hydrate(data, currency);
  const accountBrige = getAccountBridgeByFamily(mockAccount.currency!.family, mockAccount.id);

  const syncedAccount = await firstValueFrom(
    accountBrige
      .sync(mockAccount, { paginationConfig: {}, blacklistedTokenIds: [] })
      .pipe(reduce((acc, f: (arg0: Account) => Account) => f(acc), mockAccount)),
  );

  const accountRaw = toAccountRaw(syncedAccount);

  console.log("finishing sync on", currencyId, xpubOrAddress);
  return accountRaw;
};

const testSyncAccount = async (account: Account) => {
  console.log("starting sync on", account.currency.id, account.xpub ?? account.freshAddress);
  const currency = getCryptoCurrencyById(account.currency.id);
  const currencyBrige = getCurrencyBridge(currency);
  const data = await currencyBrige.preload(currency);
  currencyBrige.hydrate(data, currency);
  const accountBrige = getAccountBridgeByFamily(account.currency!.family, account.id);

  const syncedAccount = await firstValueFrom(
    accountBrige
      .sync(account, { paginationConfig: {}, blacklistedTokenIds: [] })
      .pipe(reduce((acc, f: (arg0: Account) => Account) => f(acc), account)),
  );

  const accountRaw = toAccountRaw(syncedAccount);

  console.log("finishing sync on", account.currency.id, account.xpub ?? account.freshAddress);
  return accountRaw;
};

(async () => {
  // list of accounts from input file
  const inputAccounts: AccountRaw[] = [];

  if (inputFile) {
    if (!existsSync(inputFile)) {
      console.warn(
        `Incorrect file path: ${inputFile} does not exist`,
        "Will use default addresses instead",
      );
    } else {
      // if there's a input file we parse it
      inputAccounts.push(JSON.parse(readFileSync(inputFile, "utf8")));
    }
  }

  const currencyIds = currencies?.split(",");

  for (const currencyId of currencyIds || []) {
    if (!findCryptoCurrencyById(currencyId)) {
      continue;
    }
  }

  // Basically the inputAccounts only exist after the second run
  // So we first try to sync the default addresses
  // And in the 2nd run we use the input file (which is the ouput of the first sync run)
  const migrationAddresses = inputAccounts.length ? inputAccounts : defaultAddresses;
  const filteredAddresses = (migrationAddresses as { currencyId: string }[]).filter(
    ({ currencyId }) => {
      if (currencyIds) {
        return currencyIds.includes(currencyId);
      }

      return true;
    },
  );

  let syncedAccounts: PromiseSettledResult<AccountRaw>[] = [];

  // if --inputFile we use the addresses from the input file otherwise from addresses.ts
  if (inputAccounts.length) {
    syncedAccounts = await Promise.allSettled(
      (filteredAddresses as AccountRaw[]).map(rawAccount => {
        const account = fromAccountRaw(rawAccount);
        return testSyncAccount(account);
      }),
    );
  } else {
    syncedAccounts = await Promise.allSettled(
      (filteredAddresses as MigrationAddress[]).map(migrationAddress => {
        return testSync(
          migrationAddress.currencyId,
          migrationAddress.xpub ?? migrationAddress.address,
        );
      }),
    );
  }

  const errors: string[] = [];
  const response = syncedAccounts.map((account, i) => {
    if (account.status === "fulfilled") {
      return account.value;
    } else {
      // Promise.allSettled preserve order so it's safe to use filteredAddresses[i]
      errors.push(`${filteredAddresses[i].currencyId} ${account.reason.stack}`);
    }
  });

  if (errors.length) {
    throw new Error(errors.map(err => `${err}`).join("\n\n"));
  }

  const exec = promisify(childProcess.exec);
  const outputContent = JSON.stringify(response, null, 3);

  if (!noEmit) {
    // also used in account-migration.yml to know which input file to use
    const { stdout } = await exec("git rev-parse --short HEAD");
    const outputFilePath = outputFolderPath
      ? `${outputFolderPath}/${stdout.trim()}.json`
      : `${stdout.trim()}.json`;

    console.log("Writing output....");
    writeFileSync(outputFilePath, outputContent);
    console.log(`File created: ${outputFilePath}`);
  }

  console.log("Done");

  return response;
})();
