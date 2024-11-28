import Transport from "@ledgerhq/hw-transport";

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

const OkStatus = 0x9000;
const ErrorCode = {
  0x422f: "Incorrect structure type",
  0x4230: "Incorrect certificate version",
  0x4231: "Incorrect certificate validity",
  0x4232: "Incorrect certificate validity index",
  0x4233: "Unknown signer key ID",
  0x4234: "Unknown signature algorithm",
  0x4235: "Unknown public key ID",
  0x4236: "Unknown public key usage",
  0x4237: "Incorrect elliptic curve ID",
  0x4238: "Incorrect signature algorithm associated to the public key",
  0x4239: "Unknown target device",
  0x422d: "Unknown certificate tag",
  0x3301: "Failed to hash data",
  0x422e: "expected_key_usage doesn't match certificate key usage",
  0x5720: "Failed to verify signature",
  0x4118: "trusted_name buffer is too small to contain the trusted name",
};
export class PKIError extends Error {
  constructor(cause: string) {
    super("PKIError due to " + cause);
  }
}

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
  );

  const resultCode = result.readUInt16BE(result.length - 2);
  if (resultCode !== OkStatus) {
    throw new PKIError(ErrorCode[resultCode] ?? "Unkown");
  }
};
