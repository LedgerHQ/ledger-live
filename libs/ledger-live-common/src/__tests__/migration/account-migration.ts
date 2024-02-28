import { getCryptoCurrencyById, setSupportedCurrencies } from "../../currencies";
import { encodeAccountId, toAccountRaw } from "../../account";
import { firstValueFrom, reduce } from "rxjs";
import { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily } from "../../bridge/impl";
import { migrationAddresses } from "./addresses";

const args = process.argv.slice(2);

const [currencyId] = args;

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

const getMockAccount = (currencyId: string, address: string) => {
  const currency = getCryptoCurrencyById(currencyId);
  return {
    name: "mockAccount",
    type: "Account",
    id: encodeAccountId({
      type: "mock",
      version: "1",
      currencyId: currencyId,
      xpubOrAddress: address,
      derivationMode: "ethM",
    }),
    derivationMode: "",
    operations: [],
    currency,
    creationDate: new Date(),
    unit: currency.units[0],
    balance: 0,
    spendableBalance: 0,
  };
};

export const testSync = async (currencyId: string, address: string) => {
  const mockAccount = getMockAccount(currencyId, address);
  const accountBrige = getAccountBridgeByFamily(mockAccount.currency.family, mockAccount.id);

  const value = await firstValueFrom(
    accountBrige
      .sync(mockAccount as unknown as Account, { paginationConfig: {} })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), mockAccount as unknown as Account)),
  );

  const accountRaw = toAccountRaw(value);

  return accountRaw;
};

(async () => {
  const syncedAccounts = await Promise.allSettled(
    migrationAddresses
      .filter(addresses => {
        if (currencyId) {
          return currencyId === addresses.currencyId;
        }

        return true;
      })
      .map(async ({ currencyId, address }) => {
        testSync(currencyId, address);
      }),
  );

  const response = syncedAccounts.map(account => {
    if (account.status === "fulfilled") {
      return account.value;
    } else {
      return account.reason;
    }
  });

  console.log(response);
  return response;
})();
