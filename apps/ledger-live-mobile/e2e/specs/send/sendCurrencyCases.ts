import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

/** Must match `app.init({ testedCurrencies })` in the same spec file. */
export const sendCurrencyIdsUtxoEvmA: CryptoCurrencyId[] = ["bitcoin", "ethereum", "bsc"];

export const sendCurrencyIdsUtxoEvmB: CryptoCurrencyId[] = ["dogecoin", "polygon"];

export const sendCurrencyIdsUtxoEvm: CryptoCurrencyId[] = [
  ...sendCurrencyIdsUtxoEvmA,
  ...sendCurrencyIdsUtxoEvmB,
];

export const sendCurrencyIdsOther: CryptoCurrencyId[] = ["polkadot", "cosmos"];
