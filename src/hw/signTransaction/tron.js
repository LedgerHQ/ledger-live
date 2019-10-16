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
  const tx = { ...txArg };
  const trx = new Trx(transport);
  const signature = await trx.signTransaction(path, tx.raw_data_hex);
  return Buffer.from(signature).toString("hex");
};
