import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

/** Must match `app.init({ testedCurrencies })` in the same spec file. */
export const sendCurrencyIdsUtxoEvm: CryptoCurrencyId[] = [
  "bitcoin",
  "ethereum",
  "bsc",
  "dogecoin",
  "polygon",
];

export const sendCurrencyIdsOther: CryptoCurrencyId[] = ["polkadot", "cosmos"];
