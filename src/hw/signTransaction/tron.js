// @flow
import Trx from "../../families/tron/hw-app-trx";
import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";

export default async (
  currency: CryptoCurrency,
  transport: Transport<*>,
  path: string,
  txArg: Object
) => {
  const trx = new Trx(transport);

  const signature = txArg.assetName
    ? await trx.signTransactionWithTokenName(
        path,
        txArg.rawDataHex,
        txArg.assetName
      )
    : await trx.signTransaction(path, txArg.rawDataHex);
  return Buffer.from(signature).toString("hex");
};
