import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import sample from "lodash/sample";
import BigNumber from "bignumber.js";
import { genMockAccount } from "@ledgerhq/live-common/mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { listSupportedCurrencies } from "@ledgerhq/live-common/coin-modules/registry";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { useStocksData, selectTopStocks } from "@features/platform-aggregated-assets";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  MockAccountsToolProps,
  GenerateByTypeOptions,
  GenerateByCurrencyOptions,
  GenerateEmptyOptions,
} from "@devtools/mock-accounts";

export interface UseMockAccountsToolPropsOptions {
  onApplyAccounts: (accounts: Account[]) => void | Promise<void>;
  onClearAccounts: () => void;
  version?: string;
}

const MAX_STOCK_TOKENS = 20;

const STABLECOIN_PRESET: { currencyId: string; tokenIds: string[] }[] = [
  {
    currencyId: "ethereum",
    tokenIds: [
      "ethereum/erc20/usd_tether__erc20_",
      "ethereum/erc20/usd__coin",
      "ethereum/erc20/usds_stablecoin_0xdc035d45d973e3ec169d2276ddab16f1e407384f",
      "ethereum/erc20/usde",
      "ethereum/erc20/dai_stablecoin_v2_0",
    ],
  },
  {
    currencyId: "arbitrum",
    tokenIds: [
      "arbitrum/erc20/tether_usd",
      "arbitrum/erc20/usd_coin",
      "arbitrum/erc20/usde",
      "arbitrum/erc20/paypal_usd_0x46850ad61c2b7d64d08c9c754f45254596696984",
    ],
  },
  {
    currencyId: "optimism",
    tokenIds: [
      "optimism/erc20/tether_usd",
      "optimism/erc20/usd_coin",
      "optimism/erc20/usde_0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34",
    ],
  },
  {
    currencyId: "base",
    tokenIds: [
      "base/erc20/usd_coin",
      "base/erc20/usds_stablecoin_0x820c137fa70c8691f0e44dc420a5e53c168921dc",
      "base/erc20/usde_0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34",
    ],
  },
  {
    currencyId: "solana",
    tokenIds: [
      "solana/spl/es9vmfrzacermjfrf4h2fyd4kconky11mcce8benwnyb",
      "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
      "solana/spl/usds_usdswr9apdhk5bvjkmjzff41ffux8bsxdkcr81vtwca",
      "solana/spl/usde_dekqhypn7gmrj5cartqfawefqbzb33hyf6s5icwjeont",
      "solana/spl/paypal_usd_2b1kv6dkpanxd5ixfnxcpjxmkwqjjaymczfhsfu24gxo",
    ],
  },
  {
    currencyId: "tron",
    tokenIds: [
      "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
      "tron/trc20/tekxitehnzsmse2xqrbj4w32run966rdz8",
    ],
  },
  {
    currencyId: "algorand",
    tokenIds: ["algorand/asa/312769", "algorand/asa/31566704"],
  },
];

const allCurrencies = listSupportedCurrencies();
const MAINNET_CURRENCIES = allCurrencies.filter(c => !c.isTestnetFor);
const TESTNET_CURRENCIES = allCurrencies.filter(c => !!c.isTestnetFor);

async function resolveStablecoinTokens(tokenIds: string[]): Promise<TokenCurrency[]> {
  const store = getCryptoAssetsStore();
  const resolved = await Promise.all(tokenIds.map(id => store.findTokenById(id)));
  return resolved.filter((t): t is TokenCurrency => t !== null);
}

export function useMockAccountsToolProps(
  opts: UseMockAccountsToolPropsOptions,
): MockAccountsToolProps {
  const { onApplyAccounts, onClearAccounts } = opts;
  const version = opts.version ?? "";
  const { data: stocksData, isLoading: stocksLoading } = useStocksData({
    product: "lld",
    version,
    skip: false,
  });

  const stockTokensByParent = useMemo(() => {
    if (!stocksData) return [];
    const groups = new Map<string, TokenCurrency[]>();
    for (const { ledgerId } of selectTopStocks(stocksData, MAX_STOCK_TOKENS)) {
      const currency = stocksData.cryptoOrTokenCurrencies[ledgerId];
      if (currency?.type !== "TokenCurrency") continue;
      const parentId = currency.parentCurrencyId;
      groups.set(parentId, [...(groups.get(parentId) ?? []), currency]);
    }
    return Array.from(groups, ([parentId, tokens]) => ({ parentId, tokens }));
  }, [stocksData]);

  const generateRandom = useCallback(
    async (count: number) => {
      const accounts: Account[] = [];
      for (let i = 0; i < count; i++) {
        const currency = sample(MAINNET_CURRENCIES);
        if (!currency) continue;
        accounts.push(await genMockAccount(uuidv4(), { currency }));
      }
      await onApplyAccounts(accounts);
    },
    [onApplyAccounts],
  );

  const generateByCurrency = useCallback(
    async ({ currencyIds, tokenIds, accountsPerCurrency }: GenerateByCurrencyOptions) => {
      const resolvedTokens = tokenIds.length > 0 ? await resolveStablecoinTokens(tokenIds) : [];
      const accounts = await Promise.all(
        currencyIds.flatMap(id => {
          const currency = allCurrencies.find(c => c.id === id);
          if (!currency) return [];
          return Array.from({ length: accountsPerCurrency }, async () => {
            const account = await genMockAccount(uuidv4(), { currency });
            if (resolvedTokens.length > 0) {
              account.subAccounts = resolvedTokens
                .filter(t => t.parentCurrencyId === currency.id)
                .map((token, i) => genTokenAccount(i, account, token));
            }
            return account;
          });
        }),
      );
      await onApplyAccounts(accounts);
    },
    [onApplyAccounts],
  );

  const generateEmpty = useCallback(
    async ({ currencyIds, accountsPerCurrency }: GenerateEmptyOptions) => {
      const accounts = await Promise.all(
        currencyIds.flatMap(id => {
          const currency = allCurrencies.find(c => c.id === id);
          if (!currency) return [];
          return Array.from({ length: accountsPerCurrency }, async () => {
            const account = await genMockAccount(uuidv4(), { currency, operationsSize: 0 });
            account.balance = new BigNumber(0);
            account.spendableBalance = new BigNumber(0);
            return account;
          });
        }),
      );
      await onApplyAccounts(accounts);
    },
    [onApplyAccounts],
  );

  const generateByType = useCallback(
    async (options: GenerateByTypeOptions) => {
      const accounts: Account[] = [];

      if (options.includeCryptos) {
        const pool = options.includeTestnet
          ? [...MAINNET_CURRENCIES, ...TESTNET_CURRENCIES]
          : MAINNET_CURRENCIES;
        for (let i = 0; i < options.count; i++) {
          const currency = sample(pool);
          if (!currency) continue;
          accounts.push(await genMockAccount(uuidv4(), { currency }));
        }
      }

      if (options.includeStablecoins) {
        for (const entry of STABLECOIN_PRESET) {
          const currency = getCryptoCurrencyById(entry.currencyId);
          if (!currency) continue;
          const tokens = await resolveStablecoinTokens(entry.tokenIds);
          if (tokens.length === 0) continue;
          const account = await genMockAccount(uuidv4(), { currency });
          account.subAccounts = tokens.map((token, i) => genTokenAccount(i, account, token));
          accounts.push(account);
        }
      }

      if (options.includeStocks) {
        for (const { parentId, tokens } of stockTokensByParent) {
          if (tokens.length === 0) continue;
          const currency = getCryptoCurrencyById(parentId);
          if (!currency) continue;
          const account = await genMockAccount(uuidv4(), { currency });
          account.subAccounts = tokens.map((token, i) => genTokenAccount(i, account, token));
          accounts.push(account);
        }
      }

      if (accounts.length > 0) {
        await onApplyAccounts(accounts);
      }
    },
    [onApplyAccounts, stockTokensByParent],
  );

  const clearAccounts = useCallback(() => {
    onClearAccounts();
  }, [onClearAccounts]);

  return {
    generateRandom,
    generateByCurrency,
    generateByType,
    generateEmpty,
    clearAccounts,
    stocksLoading,
    stablecoinsLoading: false,
  };
}
