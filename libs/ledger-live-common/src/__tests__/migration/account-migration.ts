import { readFileSync, existsSync } from "fs";
import BigNumber from "bignumber.js";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { argv } from "yargs";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "../../currencies";
import { encodeAccountId, toAccountRaw } from "../../account";
import { firstValueFrom, reduce } from "rxjs";
import { getAccountBridgeByFamily } from "../../bridge/impl";
import { migrationAddresses as defaultAddresses } from "./addresses";

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
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "bitcoin_testnet",
  "ethereum_ropsten",
  "ethereum_goerli",
  "ethereum_sepolia",
  "ethereum_holesky",
  "crypto_org",
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
  "optimism_goerli",
  "arbitrum",
  "arbitrum_sepolia",
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
  "polygon_zk_evm_testnet",
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
  "linea_goerli",
]);

const args = argv;

type Args = {
  /**
   * comma seperated currencyId
   * eg --currencies ethereum,polygon,bitcoin
   */
  currencies?: CryptoCurrencyId;
  /**
   * absolute path to the input json file
   * must only contain an array of raw accounts
   */
  inputFile?: string;
};

const { currencies, inputFile } = args as Args;

const getMockAccount = (currencyId: string, address: string): Partial<Account> => {
  const currency = getCryptoCurrencyById(currencyId);

  return {
    name: "mockAccount",
    type: "Account",
    id: encodeAccountId({
      type: "mock",
      version: "1",
      currencyId: currencyId,
      xpubOrAddress: address,
      derivationMode: "",
    }),
    freshAddress: address,
    derivationMode: "",
    operations: [],
    currency,
    creationDate: new Date(),
    unit: currency.units[0],
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
  };
};

export const testSync = async (currencyId: string, address: string) => {
  const mockAccount = getMockAccount(currencyId, address);
  const accountBrige = getAccountBridgeByFamily(mockAccount.currency!.family, mockAccount.id);

  const syncedAccount = await firstValueFrom(
    accountBrige
      .sync(mockAccount as unknown as Account, { paginationConfig: {} })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), mockAccount as unknown as Account)),
  );

  const accountRaw = toAccountRaw(syncedAccount);

  return accountRaw;
};

(async () => {
  if (inputFile && !existsSync(inputFile)) {
    throw new Error("File do not exist");
  }

  // list of addresses from input file
  const inputFileAddresses = [];

  // if there's a input file we parse it
  if (inputFile && existsSync(inputFile)) {
    const content = JSON.parse(readFileSync(inputFile, "utf8"));
    inputFileAddresses.concat(
      content.map(account => ({
        currencyId: account.currencyId,
        address: account.freshAddress,
      })),
    );
  }

  // we only read --currencies options if there's no input file
  const currencyIds = !inputFile && currencies?.split(",");

  // throw error if there's invalid currency ids passed in the cli
  if (currencyIds && !currencyIds.every(findCryptoCurrencyById)) {
    throw new Error("Invalid currency id");
  }

  // if --inputFile we use the addresses from the input file otherwise from `addresses.ts`
  const migrationAddresses = inputFileAddresses.length ? inputFileAddresses : defaultAddresses;

  const syncedAccounts = await Promise.allSettled(
    migrationAddresses
      .filter(addresses => {
        if (currencyIds) {
          return currencyIds.includes(addresses.currencyId);
        }

        return true;
      })
      .map(async ({ currencyId, address }) => {
        return testSync(currencyId, address);
      }),
  );

  const response = syncedAccounts.map(account => {
    if (account.status === "fulfilled") {
      return account.value;
    } else {
      return account.reason;
    }
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(response));

  return response;
})();
