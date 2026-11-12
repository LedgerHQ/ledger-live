import type { ReceiveFamilyTraits } from "@features/flow-receive";
import { getAccountDelegationSync } from "@ledgerhq/live-common/families/tezos/bakers";
import type { ReceiveAddressConfigInput } from "~/mvvm/features/Receive/utils/getReceiveFamilyConfig";

export default function receiveAddressConfig({
  legacyAccount,
}: ReceiveAddressConfigInput): Partial<ReceiveFamilyTraits> {
  const delegation = legacyAccount && getAccountDelegationSync(legacyAccount);
  return { notices: delegation?.receiveShouldWarnDelegation ? ["tezosDelegation"] : [] };
}
