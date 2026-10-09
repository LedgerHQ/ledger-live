import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getCosmosDummyRecipient } from "@ledgerhq/coin-cosmos/logic";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import extensions from "./bridgeExtensions";

describe("cosmos bridge extensions", () => {
  describe("getEstimationRecipient", () => {
    it.each([
      ["cosmos", "cosmos1"],
      ["osmosis", "osmo1"],
      ["injective", "inj1"],
    ])("names a well-formed %s address to estimate fees against", (currencyId, prefix) => {
      const account = genAccount("estimation", { currency: getCryptoCurrencyById(currencyId) });

      const recipient = extensions.getEstimationRecipient!(account);

      expect(recipient.startsWith(prefix)).toBe(true);
      expect(recipient).toBe(getCosmosDummyRecipient(currencyId));
    });
  });
});

describe("cosmos isAccountEmpty", () => {
  it("defers to the default check for a token account", () => {
    const tokenAccount = {
      type: "TokenAccount",
      operationsCount: 0,
      balance: new BigNumber(0),
    } as unknown as AccountLike;

    expect(extensions.isAccountEmpty!(tokenAccount)).toBe(true);
  });

  it("treats a token account holding a balance as not empty", () => {
    const tokenAccount = {
      type: "TokenAccount",
      operationsCount: 0,
      balance: new BigNumber(1),
    } as unknown as AccountLike;

    expect(extensions.isAccountEmpty!(tokenAccount)).toBe(false);
  });
});

describe("cosmos isAccountEmpty on an account", () => {
  const cosmosAccount = (fields: { sequence: number; balance: BigNumber }) =>
    ({
      ...genAccount("empty", { currency: getCryptoCurrencyById("cosmos") }),
      ...fields,
    }) as unknown as AccountLike;

  it.each([
    ["has no balance and has never sent", 0, new BigNumber(0), true],
    ["has no balance but has sent before", 3, new BigNumber(0), false],
    ["holds a balance and has never sent", 0, new BigNumber(1), false],
  ])("an account that %s is empty: %s", (_label, sequence, balance, expected) => {
    expect(extensions.isAccountEmpty!(cosmosAccount({ sequence, balance }))).toBe(expected);
  });
});
