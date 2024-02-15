import type Transport from "@ledgerhq/hw-transport";
import { bip32asBuffer } from "./bip32";

/**
 * address format is one of legacy | p2sh | bech32 | bech32m | cashaddr
 */
export type AddressFormat = "legacy" | "p2sh" | "bech32" | "bech32m" | "cashaddr";
const addressFormatMap = {
  legacy: 0,
  p2sh: 1,
  bech32: 2,
  cashaddr: 3,
};
export async function getWalletPublicKey(
  transport: Transport,
  options: {
    path: string;
    verify?: boolean;
    format?: AddressFormat;
  },
): Promise<{
  publicKey: string;
  bitcoinAddress: string;
  chainCode: string;
}> {
  const { path, verify, format } = {
    verify: false,
    format: "legacy",
    ...options,
  };

  if (!(format in addressFormatMap)) {
    throw new Error("btc.getWalletPublicKey invalid format=" + format);
  }

  const buffer = bip32asBuffer(path);
  const p1 = verify ? 1 : 0;
  const p2 = addressFormatMap[format];
  const response = await transport.send(0xe0, 0x40, p1, p2, buffer);
  const publicKeyLength = response[0];
  const addressLength = response[1 + publicKeyLength];
  const publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
  const bitcoinAddress = response
    .slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength)
    .toString("ascii");
  const chainCode = response
    .slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32)
    .toString("hex");
  return {
    publicKey,
    bitcoinAddress,
    chainCode,
  };
}
