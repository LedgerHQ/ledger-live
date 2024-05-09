import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { hydrate } from "./js-preload";
import { SolanaPreloadData } from "./types";

describe("hydrate", () => {
  it.each([undefined, null, {}, { version: null }, { version: undefined }, {}])(
    "should return undefined if data is corrupted (%p value)",
    value => {
      expect(hydrate(value as unknown as SolanaPreloadData, {} as CryptoCurrency)).toEqual(
        undefined,
      );
    },
  );
});
