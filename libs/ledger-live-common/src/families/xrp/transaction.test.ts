import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";

function makeTransaction(fields: Partial<Transaction>) {
  return {
    family: "xrp",
    amount: new BigNumber("2.5").shiftedBy(38),
    recipient: "rRecipient",
    fees: new BigNumber(12),
    networkInfo: null,
    tag: null,
    ...fields,
  } as Transaction;
}

describe("xrp transaction raw conversion", () => {
  it("keeps the mode and the token of an opt-in", () => {
    const transaction = makeTransaction({
      mode: "changeTrust",
      assetReference: "USD",
      assetOwner: ISSUER,
    });

    const revived = fromTransactionRaw(JSON.parse(JSON.stringify(toTransactionRaw(transaction))));

    expect(revived).toMatchObject({
      mode: "changeTrust",
      assetReference: "USD",
      assetOwner: ISSUER,
    });
  });

  it("adds no token field to a native send", () => {
    const raw = toTransactionRaw(makeTransaction({}));

    expect(raw).not.toHaveProperty("mode");
    expect(raw).not.toHaveProperty("assetReference");
    expect(raw).not.toHaveProperty("assetOwner");
  });
});

describe("xrp formatTransaction", () => {
  const account = {
    type: "Account",
    currency: { units: [{ name: "XRP", code: "XRP", magnitude: 6 }] },
    subAccounts: [
      {
        type: "TokenAccount",
        id: "usd-account",
        token: { units: [{ name: "USD", code: "USD", magnitude: 38 }] },
      },
    ],
  } as unknown as Account;

  it("formats a token send in the token unit and its fee in XRP", () => {
    const text = formatTransaction(makeTransaction({ subAccountId: "usd-account" }), account);

    expect(text).toMatch(/SEND 2\.5\sUSD/);
    expect(text).toMatch(/with fee=0\.000012\sXRP/);
  });

  it("formats an opt-in with its token and limit", () => {
    const text = formatTransaction(
      makeTransaction({ mode: "changeTrust", assetReference: "USD", assetOwner: ISSUER }),
      account,
    );

    expect(text).toContain(`TRUST USD ISSUED BY ${ISSUER}`);
    expect(text).toContain(`LIMIT ${new BigNumber("2.5").shiftedBy(38).toFixed()}`);
  });
});
