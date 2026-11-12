import type { Account } from "@ledgerhq/types-live";
import type { ReceiveFamilyTraits } from "@features/flow-receive";
import { getAccountDelegationSync } from "@ledgerhq/live-common/families/tezos/bakers";
import type { ReceiveAddressConfigInput } from "../types";

export default function receiveAddressConfig({
  legacyAccount,
}: ReceiveAddressConfigInput<Account>): Partial<ReceiveFamilyTraits> {
  const delegation = legacyAccount && getAccountDelegationSync(legacyAccount);
  return { notices: delegation?.receiveShouldWarnDelegation ? ["tezosDelegation"] : [] };
}
