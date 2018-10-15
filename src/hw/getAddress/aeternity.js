// @flow

import type { CryptoCurrency } from "../../types";
import Ae from "@aeternity/ledger-app-api";
import type Transport from "@ledgerhq/hw-transport";

export default async (
  transport: Transport<*>,
  currency: CryptoCurrency,
  accountIndex: string,
  verify: boolean
) => {
  const ae = new Ae(transport);
  const address = await ae.getAddress(+accountIndex, verify);
  return { path: accountIndex, address, publicKey: "" };
};
