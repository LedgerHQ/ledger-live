/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { Account } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "./exchange";

describe("exchange", () => {
  it("should serialize address parameters when address format is not provided", () => {
    const account = {
      freshAddressPath: "44'/354'/0'/0'/0'",
      derivationMode: "polkadotbip44",
    } as Account;

    const result = getSerializedAddressParameters(account);
    expect(result).toEqual(
      Buffer.from([0, 5, 128, 0, 0, 44, 128, 0, 1, 98, 128, 0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0]),
    );
  });

  it.each([
    { addressFormat: "legacy", start: 0 },
    { addressFormat: "p2sh", start: 1 },
    { addressFormat: "bech32", start: 2 },
    { addressFormat: "bitcoin_cash", start: 3 },
    { addressFormat: "bech32m", start: 4 },
  ])(
    "should serialize address parameters when address format is provided (%s)",
    ({ addressFormat, start }) => {
      const account = {
        freshAddressPath: "44'/354'/0'/0'/0'",
        derivationMode: "polkadotbip44",
      } as Account;

      const result = getSerializedAddressParameters(account, addressFormat);
      expect(result).toEqual(
        Buffer.from([
          start,
          5,
          128,
          0,
          0,
          44,
          128,
          0,
          1,
          98,
          128,
          0,
          0,
          0,
          128,
          0,
          0,
          0,
          128,
          0,
          0,
          0,
        ]),
      );
    },
  );
});
