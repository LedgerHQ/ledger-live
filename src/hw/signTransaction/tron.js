// @flow
import Trx from "@ledgerhq/hw-app-trx";
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";

export default async (
  currency: CryptoCurrency,
  transport: Transport<*>,
  path: string,
  txArg: Object
) => {
  const trx = new Trx(transport);

  const signature = await trx.signTransaction(
    path,
    txArg.rawDataHex,
    txArg.tokenSignature ? [txArg.tokenSignature] : []
  );

  return signature;
};
