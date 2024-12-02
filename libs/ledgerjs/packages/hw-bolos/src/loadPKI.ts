import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { errorCodeValue, throwError } from "./PKIError";

const handledErrorCode = errorCodeValue.concat(StatusCodes.OK);

const CLA = 0xb0;
const INS = 0x06;
const P2 = 0x00;

// Extract from https://github.com/LedgerHQ/ledger-secure-sdk/blob/d59b21f8a1f2e78ad50b5a8a21d0daac68826643/include/os_pki.h#L74
const keyUsage = {
  GENUINE_CHECK: 0x01,
  EXCHANGE_PAYLOAD: 0x02,
  NFT_METADATA: 0x03,
  TRUSTED_NAME: 0x04,
  BACKUP_PROVIDER: 0x05,
  RECOVER_ORCHESTRATOR: 0x06,
  PLUGIN_METADATA: 0x07,
  COIN_META: 0x08,
  SEED_ID_AUTH: 0x09,
  UNKNOWN: 0x0a,
};

/**
 * Load certificate
 */
export default async (
  transport: Transport,
  key: keyof typeof keyUsage,
  descriptor: string,
  signature: string,
): Promise<void> => {
  const descriptorBuffer = Buffer.from(descriptor, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  const result = await transport.send(
    CLA,
    INS,
    keyUsage[key],
    P2,
    Buffer.concat([
      new Uint8Array(descriptorBuffer),
      new Uint8Array(Buffer.from("15", "hex")),
      new Uint8Array(Buffer.from([signatureBuffer.length])),
      new Uint8Array(signatureBuffer),
    ]),
    handledErrorCode,
  );

  const resultCode = result.readUInt16BE(result.length - 2);
  if (resultCode !== StatusCodes.OK) {
    throwError(resultCode);
  }
};
