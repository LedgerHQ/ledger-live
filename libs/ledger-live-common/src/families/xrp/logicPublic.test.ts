import type { TokenCurrency } from "@domain/entity-currency-token";
import { MAX_TRUST_LIMIT } from "@ledgerhq/coin-xrp/logic-public";
import type { Account } from "@ledgerhq/types-live";
import { getMaxTrustLimitForToken, isTokenRemovalPending } from "./logicPublic";

function makePendingOptOut(assetReference: string, assetOwner: string) {
  return { transactionRaw: { assetReference, assetOwner }, type: "OPT_OUT" };
}

function makeAccountWithPending(...pendingOperations: unknown[]) {
  return { pendingOperations } as Account;
}

describe("getMaxTrustLimitForToken", () => {
  it("returns the protocol maximum, in base units", () => {
    expect(getMaxTrustLimitForToken().toFixed()).toBe(MAX_TRUST_LIMIT.toString());
  });
});

describe("isTokenRemovalPending", () => {
  const usd = { tokenIdentifier: "USD", contractAddress: "rIssuer" } as TokenCurrency;

  it("is pending while an OPT_OUT carries the token's asset pair", () => {
    const account = makeAccountWithPending(makePendingOptOut("USD", "rIssuer"));

    expect(isTokenRemovalPending(account, usd)).toBe(true);
  });

  it("is not pending for another token, another issuer or another operation type", () => {
    const account = makeAccountWithPending(
      makePendingOptOut("EUR", "rIssuer"),
      makePendingOptOut("USD", "rOther"),
      { type: "OPT_IN", transactionRaw: { assetReference: "USD", assetOwner: "rIssuer" } },
    );

    expect(isTokenRemovalPending(account, usd)).toBe(false);
  });
});
