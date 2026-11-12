import type { ReceiveFamilyTraits } from "@features/flow-receive";

export default function receiveAddressConfig(): Partial<ReceiveFamilyTraits> {
  return { notices: ["utxo"] };
}
