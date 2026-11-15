import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
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

describe("formatTransaction", () => {
  const xrpUnit = { name: "XRP", code: "XRP", magnitude: 6 };
  const usdUnit = { name: "USD", code: "USD", magnitude: 38 };
  const usdAccount = {
    type: "TokenAccount",
    id: "usdAccount",
    token: { type: "TokenCurrency", units: [usdUnit] },
  } as TokenAccount;
  const account = {
    type: "Account",
    currency: { type: "CryptoCurrency", units: [xrpUnit] },
    subAccounts: [usdAccount],
  } as unknown as Account;

  it("shows a token send in the token unit and its fee in XRP", () => {
    const formatted = formatTransaction(makeTransaction({ subAccountId: "usdAccount" }), account);

    expect(formatted).toMatch(/SEND 2\.5\sUSD/);
    expect(formatted).toMatch(/with fee=0\.000012\sXRP/);
  });

  it("shows a native send in XRP", () => {
    const formatted = formatTransaction(
      makeTransaction({ amount: new BigNumber(2_500_000) }),
      account,
    );

    expect(formatted).toMatch(/SEND 2\.5\sXRP/);
  });
});
