import type { SignTypedData } from "@ledgerhq/coin-evm/confidential";
import { executeWithSigner } from "@ledgerhq/live-common/bridge/setup";
import { isDmkTransport } from "@ledgerhq/live-common/hw/dmkUtils";
import {
  DmkSignerEth,
  LegacySignerEth,
  createSignTypedData,
  type ConfidentialTypedData,
  type EvmSigner,
} from "@ledgerhq/live-signer-evm";

const evmSignerContext = executeWithSigner<EvmSigner>(transport =>
  isDmkTransport(transport)
    ? new DmkSignerEth(transport.dmk, transport.sessionId)
    : new LegacySignerEth(transport),
);

export function signPermitOnDevice(
  deviceId: string,
  path: string,
  typedData: Parameters<SignTypedData>[0],
): ReturnType<SignTypedData> {
  return evmSignerContext(deviceId, signer =>
    createSignTypedData(signer, path)(typedData as ConfidentialTypedData),
  );
}
