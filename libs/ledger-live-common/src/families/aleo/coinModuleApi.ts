import { createApi as createAleoApi } from "@ledgerhq/coin-aleo/api";
import { notSupportedApi, type CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// Balance and history need the view key: they stay on the legacy bridge, only the public account status is served here.
export function createLocalAleoApi(
  currencyId: string,
): CoinModuleImpl<any, any> &
  BridgeApi &
  Pick<ReturnType<typeof createAleoApi>, "getAccountStatus"> {
  const { getAccountStatus } = createAleoApi(currencyId);
  return { ...notSupportedApi(), getAccountStatus };
}
