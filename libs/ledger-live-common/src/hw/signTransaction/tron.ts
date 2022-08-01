import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
export default async (
  currency: CryptoCurrency,
  transport: Transport,
  path: string,
  txArg: Record<string, any>
) => {
  const trx = new Trx(transport);
  const signature = await trx.signTransaction(
    path,
    txArg.rawDataHex,
    txArg.tokenSignature ? [txArg.tokenSignature] : []
  );
  return signature;
};
