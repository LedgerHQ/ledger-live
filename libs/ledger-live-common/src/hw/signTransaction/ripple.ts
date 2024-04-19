import { encode } from "xrpl-binary-codec-prerelease";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export default async (
  currency: CryptoCurrency,
  transport: Transport,
  path: string,
  txArg: Record<string, any>,
) => {
  const tx = { ...txArg };
  const xrp = new Xrp(transport);
  const { publicKey } = await xrp.getAddress(path);
  tx.SigningPubKey = publicKey.toUpperCase();
  const rawTxHex = encode(tx).toUpperCase();
  tx.TxnSignature = (await xrp.signTransaction(path, rawTxHex)).toUpperCase();
  return encode(tx).toUpperCase();
};
