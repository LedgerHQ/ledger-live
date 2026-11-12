import type { ReceiveFamilyTraits } from "@features/flow-receive";
import type { ReceiveAddressConfigInput } from "~/mvvm/features/Receive/utils/getReceiveFamilyConfig";

export default function receiveAddressConfig({
  legacyAccount,
}: ReceiveAddressConfigInput): Partial<ReceiveFamilyTraits> {
  return { notices: legacyAccount?.operationsCount === 0 ? ["tronInactiveAccount"] : [] };
}
