import type { Account } from "@ledgerhq/types-live";
import type { ReceiveFamilyTraits } from "@features/flow-receive";
import type { ReceiveAddressConfigInput } from "../types";

export default function receiveAddressConfig({
  legacyAccount,
}: ReceiveAddressConfigInput<Account>): Partial<ReceiveFamilyTraits> {
  return { notices: legacyAccount?.operationsCount === 0 ? ["tronInactiveAccount"] : [] };
}
