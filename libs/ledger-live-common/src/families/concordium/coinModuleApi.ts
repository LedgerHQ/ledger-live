import { createApi as createConcordiumApi } from "@ledgerhq/coin-concordium/api/index";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";

// Concordium stays on its legacy bridge for every other read.
export function createLocalConcordiumApi(currencyId: string) {
  const { getAccountStatus } = createConcordiumApi(currencyId);
  return { ...notSupportedApi(), getAccountStatus };
}
