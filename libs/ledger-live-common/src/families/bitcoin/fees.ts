import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

// correspond ~ to min relay fees but determined empirically for a tx to be accepted by network
const minFees = {
  bitcoin: 1000,
  bitcoin_gold: 1000,
  pivx: 2000,
  stakenet: 1000,
  stealthcoin: 2000,
  qtum: 4000,
  stratis: 2000,
  vertcoin: 2000,
  viacoin: 2000,
  peercoin: 2000,
};
export const getMinRelayFee = (currency: CryptoCurrency): number =>
  minFees[currency.id] || 0;
