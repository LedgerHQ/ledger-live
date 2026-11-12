import type { ReceiveFamilyTraits, ReceiveNoticeId } from "@features/flow-receive";
import type { ReceiveAddressConfigInput } from "~/mvvm/features/Receive/utils/getReceiveFamilyConfig";

const TAPROOT_PURPOSE = "m/86h/";

export default function receiveAddressConfig({
  descriptor,
  asset,
}: ReceiveAddressConfigInput): Partial<ReceiveFamilyTraits> {
  const notices: ReceiveNoticeId[] = ["utxo"];
  if (descriptor.type === "utxo" && descriptor.path.startsWith(TAPROOT_PURPOSE)) {
    notices.push("taproot");
  }
  if (asset.id === "dash") notices.push("dashStaking");
  return { notices };
}
