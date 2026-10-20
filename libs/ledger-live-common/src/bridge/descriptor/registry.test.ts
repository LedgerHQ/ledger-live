import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountTrackingAttributes, getUserTrackingAttributes } from "./registry";

// One coin declares tracking attributes; every other coin keeps its real descriptor.
jest.mock("../../families/stellar/descriptor", () => {
  const actual = jest.requireActual("../../families/stellar/descriptor");
  return {
    descriptor: {
      ...actual.descriptor,
      getAccountTrackingAttributes: (account: AccountLike) => ({ accountAttribute: account.id }),
      getUserTrackingAttributes: (accounts: AccountLike[]) => ({
        userAttribute: accounts.length,
      }),
    },
  };
});

const mainAccount = (id: string, currencyId: string): AccountLike =>
  ({
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
  }) as unknown as AccountLike;

describe("getAccountTrackingAttributes", () => {
  it("returns the attributes the account's coin declares", () => {
    expect(getAccountTrackingAttributes(mainAccount("a1", "stellar"))).toEqual({
      accountAttribute: "a1",
    });
  });

  it.each(["bitcoin", "ethereum"])("returns no attribute for a %s account", currencyId => {
    expect(getAccountTrackingAttributes(mainAccount("a1", currencyId))).toEqual({});
  });
});

describe("getUserTrackingAttributes", () => {
  it("hands every account to each coin that declares user attributes", () => {
    expect(
      getUserTrackingAttributes([mainAccount("a1", "stellar"), mainAccount("a2", "bitcoin")]),
    ).toMatchObject({ userAttribute: 2 });
  });

  it.each([
    ["undefined", undefined],
    ["an empty list", []],
  ])("still asks every coin for %s, so a removed account leaves no stale value", (_, accounts) => {
    expect(getUserTrackingAttributes(accounts)).toMatchObject({ userAttribute: 0 });
  });
});
