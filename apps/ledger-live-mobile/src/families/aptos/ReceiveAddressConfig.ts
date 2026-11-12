import type { ReceiveFamilyTraits } from "@features/flow-receive";
import type { ReceiveAddressConfigInput } from "~/mvvm/features/Receive/utils/getReceiveFamilyConfig";

// The Aptos app no longer supports Nano S (`llmNanoSDeprecation`).
export default function receiveAddressConfig({
  featureFlags,
}: ReceiveAddressConfigInput): Partial<ReceiveFamilyTraits> {
  return featureFlags.llmNanoSDeprecation?.enabled ? { unsupportedDeviceModelIds: ["nanoS"] } : {};
}
