import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import type { CoinModuleLoader } from "../../coin-modules/types";

const notCallableInTests = () => {
  throw new Error("loader thunk not callable in this support-only test fixture");
};

/** Test-only: make exactly these currency ids supported, via minimal stub loaders. */
export function supportOnlyForTest(ids: string[]): void {
  const byFamily: Record<string, string[]> = {};
  for (const id of ids) {
    const { family } = getCryptoCurrencyById(id);
    (byFamily[family] ??= []).push(id);
  }
  resetCoinModulesForTests();
  registerCoinModules(
    Object.entries(byFamily).map(
      ([family, supportedCoins]): CoinModuleLoader => ({
        family,
        supportedCoins,
        loadSetup: notCallableInTests,
        loadTransaction: notCallableInTests,
      }),
    ),
  );
}
