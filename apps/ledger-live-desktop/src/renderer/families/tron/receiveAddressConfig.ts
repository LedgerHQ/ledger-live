import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { GetReceiveFamilyConfig } from "@features/flow-receive";

export const receiveAddressConfig: GetReceiveFamilyConfig<TronAccount> = ({ legacyAccount }) => {
  const isInactiveAccount = legacyAccount?.operationsCount === 0;
  return isInactiveAccount ? { notices: ["tronInactiveAccount"] } : {};
};
