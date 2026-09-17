import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import sample from "lodash/sample";
import VersionNumber from "react-native-version-number";
import { genMockAccount } from "@ledgerhq/live-common/mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { listSupportedCurrencies } from "@ledgerhq/live-common/coin-modules/registry";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useTokenById } from "@features/platform-currencies";
import { useStocksData, selectTopStocks } from "@features/platform-aggregated-assets";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import BigNumber from "bignumber.js";
import type {
  MockAccountsToolProps,
  GenerateByTypeOptions,
  GenerateByCurrencyOptions,
  GenerateEmptyOptions,
} from "@devtools/mock-accounts";

export interface UseMockAccountsToolPropsOptions {
  onApplyAccounts: (accounts: Account[]) => void | Promise<void>;
  onClearAccounts: () => void;
}

const MAX_STOCK_TOKENS = 20;

const STABLECOIN_IDS = [
  "ethereum/erc20/usd__coin",
  "ethereum/erc20/usd_tether__erc20_",
  "ethereum/erc20/dai_stablecoin_v2_0",
  "ethereum/erc20/dai_stablecoin_v1_0",
  "ethereum/erc20/trueusd",
  "ethereum/erc20/paxos_standard__pax_",
  "ethereum/erc20/stasis_eurs_token", // gitleaks:allow
  "tron/trc20/TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
  "algorand/asa/312769",
  "algorand/asa/163650",
] as const;

const allCurrencies = listSupportedCurrencies();
const MAINNET_CURRENCIES = allCurrencies.filter(c => !c.isTestnetFor);
const TESTNET_CURRENCIES = allCurrencies.filter(c => !!c.isTestnetFor);

async function resolveTokens(tokenIds: string[]): Promise<TokenCurrency[]> {
  const store = getCryptoAssetsStore();
  const resolved = await Promise.all(tokenIds.map(id => store.findTokenById(id)));
  return resolved.filter((t): t is TokenCurrency => t != null);
}

export function useMockAccountsToolProps(
  opts: UseMockAccountsToolPropsOptions,
): MockAccountsToolProps {
  const { onApplyAccounts, onClearAccounts } = opts;
  const version = VersionNumber.appVersion ?? "";
  const { data: stocksData, isLoading: stocksLoading } = useStocksData({
    product: "llm",
    version,
    skip: false,
  });

  // Each token resolved individually — required by useTokenById (Rules of Hooks)
  const { data: t0, isLoading: l0 } = useTokenById(STABLECOIN_IDS[0]);
  const { data: t1, isLoading: l1 } = useTokenById(STABLECOIN_IDS[1]);
  const { data: t2, isLoading: l2 } = useTokenById(STABLECOIN_IDS[2]);
  const { data: t3, isLoading: l3 } = useTokenById(STABLECOIN_IDS[3]);
  const { data: t4, isLoading: l4 } = useTokenById(STABLECOIN_IDS[4]);
  const { data: t5, isLoading: l5 } = useTokenById(STABLECOIN_IDS[5]);
  const { data: t6, isLoading: l6 } = useTokenById(STABLECOIN_IDS[6]);
  const { data: t7, isLoading: l7 } = useTokenById(STABLECOIN_IDS[7]);
  const { data: t8, isLoading: l8 } = useTokenById(STABLECOIN_IDS[8]);
  const { data: t9, isLoading: l9 } = useTokenById(STABLECOIN_IDS[9]);

  const stablecoinsLoading = l0 || l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9;

  const stablecoinGroups = useMemo((): { parentId: string; tokens: TokenCurrency[] }[] => {
    const all = [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9].filter(
      (t): t is TokenCurrency => t !== undefined,
    );
    const groups = new Map<string, TokenCurrency[]>();
    for (const token of all) {
      const parentId = token.parentCurrencyId;
      groups.set(parentId, [...(groups.get(parentId) ?? []), token]);
    }
    return Array.from(groups, ([parentId, tokens]) => ({ parentId, tokens }));
  }, [t0, t1, t2, t3, t4, t5, t6, t7, t8, t9]);

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
      const resolvedTokens = tokenIds.length > 0 ? await resolveTokens(tokenIds) : [];
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
        for (const { parentId, tokens } of stablecoinGroups) {
          if (tokens.length === 0) continue;
          const currency = getCryptoCurrencyById(parentId);
          if (!currency) continue;
          accounts.push(
            await genMockAccount(uuidv4(), {
              currency,
              tokensData: tokens,
              tokenIds: tokens.map(t => t.id),
              subAccountsCount: tokens.length,
            }),
          );
        }
      }

      if (options.includeStocks) {
        for (const { parentId, tokens } of stockTokensByParent) {
          if (tokens.length === 0) continue;
          const currency = getCryptoCurrencyById(parentId);
          if (!currency) continue;
          accounts.push(
            await genMockAccount(uuidv4(), {
              currency,
              tokensData: tokens,
              tokenIds: tokens.map(t => t.id),
              subAccountsCount: tokens.length,
            }),
          );
        }
      }

      if (accounts.length > 0) {
        await onApplyAccounts(accounts);
      }
    },
    [onApplyAccounts, stablecoinGroups, stockTokensByParent],
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
    stablecoinsLoading,
  };
}
