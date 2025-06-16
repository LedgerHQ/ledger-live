/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import { setEnv } from "@ledgerhq/live-env";
import type { Account, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/coin-solana/types";
import { getCurrentSolanaPreloadData } from "@ledgerhq/coin-solana/preload-data";
import { LEDGER_VALIDATOR_DEFAULT } from "@ledgerhq/coin-solana/utils";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { getCryptoCurrencyById } from "../../currencies";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { genAccount, genAddingOperationsInAccount } from "../../mock/account";
import * as hooks from "./react";

jest.setTimeout(2 * 60 * 1000);

const localCache = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});
describe("solana/react", () => {
  describe("useValidators", () => {
    it("should return validators", async () => {
      const { prepare, account } = setup();
      await prepare();
      const { result } = renderHook(() => hooks.useValidators(account.currency));
      const data = getCurrentSolanaPreloadData(account.currency);

      expect(result.current).toStrictEqual(data.validators);
    });

    it("should return validators", async () => {
      const { prepare, account } = setup();
      await prepare();
      const { result } = renderHook(() => hooks.useValidators(account.currency, "Ledger"));

      expect(
        result.current.some(
          validator => validator.voteAccount === LEDGER_VALIDATOR_DEFAULT.voteAccount,
        ),
      ).toBe(true);
    });
  });
});

function setup(): {
  account: Account;
  currencyBridge: CurrencyBridge;
  transaction: Transaction;
  prepare: () => Promise<any>;
} {
  setEnv("MOCK", "1");
  setEnv("EXPERIMENTAL_CURRENCIES", "solana");
  const seed = "solana-2";
  const currency = getCryptoCurrencyById("solana");
  const a = genAccount(seed, {
    currency,
  });
  const account = genAddingOperationsInAccount(a, 3, seed);
  const currencyBridge = getCurrencyBridge(currency);
  const bridge = getAccountBridge(account);
  const transaction = bridge.createTransaction(account);
  return {
    account,
    currencyBridge,
    transaction,
    prepare: async () => cache.prepareCurrency(currency),
  };
}
