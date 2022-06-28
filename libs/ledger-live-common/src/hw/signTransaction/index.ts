import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import Transport from "@ledgerhq/hw-transport";
import ripple from "./ripple";
import tron from "./tron";
// TODO deprecate this approach
type Resolver = (
  currency: CryptoCurrency,
  transport: Transport,
  path: string,
  transaction: any
) => Promise<string>;
const all = {
  ripple,
  tron,
};

const m: Resolver = (currency, transport, path, transaction) => {
  const r = all[currency.id];
  if (r) return r(currency, transport, path, transaction);
  throw new Error(`unsupported signTransaction(${currency.id})`);
};

export default m;
