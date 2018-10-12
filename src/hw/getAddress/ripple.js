// @flow

import type { CryptoCurrency } from "../../types";
import Xrp from "@ledgerhq/hw-app-xrp";
import type Transport from "@ledgerhq/hw-transport";

export default async (
  transport: Transport<*>,
  currency: CryptoCurrency,
  path: string,
  verify: boolean
) => {
  const xrp = new Xrp(transport);
  const { address, publicKey } = await xrp.getAddress(path, verify);
  return { path, address, publicKey };
};
