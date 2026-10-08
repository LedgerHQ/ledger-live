import { executeWithSigner } from "@ledgerhq/live-common/bridge/setup";
import { createSigner, type Signer } from "@ledgerhq/live-common/families/evm/signer";

const evmSignerContext = executeWithSigner<Signer>(createSigner);

/** Clear-signs an unsigned serialized EVM transaction on the device; resolves to the 65-byte signature. */
export function signTransactionOnDevice(
  deviceId: string,
  path: string,
  unsignedTransaction: string,
): Promise<string> {
  return evmSignerContext(deviceId, signer => signer.signTransaction(path, unsignedTransaction));
}
