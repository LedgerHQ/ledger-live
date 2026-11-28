import { getAccountDelegationSync } from "@ledgerhq/live-common/families/tezos/bakers";
import type { Account } from "@ledgerhq/types-live";
import type { GetReceiveFamilyConfig } from "@features/flow-receive";

const receiveAddressConfig: GetReceiveFamilyConfig<Account> = ({ legacyAccount }) => {
  const delegation = legacyAccount && getAccountDelegationSync(legacyAccount);
  return delegation?.receiveShouldWarnDelegation ? { notices: ["tezosDelegation"] } : {};
};

export default receiveAddressConfig;
