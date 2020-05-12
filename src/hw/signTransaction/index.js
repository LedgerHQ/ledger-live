// @flow

import type Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency } from "../../types";

import ethereum from "./ethereum";
import ripple from "./ripple";
import tron from "./tron";

type Resolver = (
  currency: CryptoCurrency,
  transport: Transport<*>,
  path: string,
  transaction: *
) => Promise<string>;

const all = {
  ethereum,
  ethereum_testnet: ethereum,
  ethereum_classic: ethereum,
  ethereum_classic_testnet: ethereum,
  ripple,
  tron,
};

const m: Resolver = (currency, transport, path, transaction) => {
  const r = all[currency.id];
  if (r) return r(currency, transport, path, transaction);
  throw new Error(`unsupported signTransaction(${currency.id})`);
};

export default m;
