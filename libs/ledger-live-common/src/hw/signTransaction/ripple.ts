import BinaryCodec from "ripple-binary-codec";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
export default async (
  currency: CryptoCurrency,
  transport: Transport,
  path: string,
  txArg: Record<string, any>
) => {
  const tx = { ...txArg };
  const xrp = new Xrp(transport);
  const { publicKey } = await xrp.getAddress(path);
  tx.SigningPubKey = publicKey.toUpperCase();
  const rawTxHex = BinaryCodec.encode(tx).toUpperCase();
  tx.TxnSignature = (await xrp.signTransaction(path, rawTxHex)).toUpperCase();
  return BinaryCodec.encode(tx).toUpperCase();
};
