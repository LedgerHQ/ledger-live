import { getAccountDelegationSync } from "@ledgerhq/live-common/families/tezos/bakers";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import type { GetReceiveFamilyConfig } from "@features/flow-receive";

export const receiveAddressConfig: GetReceiveFamilyConfig<TezosAccount> = ({ legacyAccount }) => {
  const delegation = legacyAccount && getAccountDelegationSync(legacyAccount);
  return delegation?.receiveShouldWarnDelegation ? { notices: ["tezosDelegation"] } : {};
};
