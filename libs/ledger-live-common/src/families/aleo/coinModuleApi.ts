import { createApi as createAleoApi } from "@ledgerhq/coin-aleo/api";
import { notSupportedApi } from "@ledgerhq/coin-module-framework/api/index";

// Aleo reads its balance and history with the view key: they stay on its legacy bridge.
export function createLocalAleoApi(currencyId: string) {
  const { getAccountStatus } = createAleoApi(currencyId);
  return { ...notSupportedApi(), getAccountStatus };
}
