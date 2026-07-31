import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";
import { createTransaction } from "./createTransaction";
import type { Transaction, TransactionRaw } from "../types/bridge";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const account = { type: "Account", currency: getCryptoCurrencyById("zcash") } as Account;

const transaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "zcash",
    transferType: "shielded",
    amount: new BigNumber(150_000_000),
    recipient: T_ADDRESS,
    useAllAmount: false,
    ...overrides,
  }) as Transaction;

describe("createTransaction", () => {
  it("starts empty on the transparent flow, which updateTransaction re-derives later", () => {
    expect(createTransaction(account)).toEqual({
      family: "zcash",
      amount: new BigNumber(0),
      recipient: "",
      transferType: "transparent",
      useAllAmount: false,
      feesStrategy: "medium",
    });
  });
});

describe("formatTransaction", () => {
  // The unit formatter separates value and code with a non-breaking space.
  const format = (tx: Transaction) => formatTransaction(tx, account).replace(/\s+/g, " ").trim();

  it("states the amount in ZEC and names the flow", () => {
    expect(format(transaction())).toBe(`SEND 1.5 ZEC TO ${T_ADDRESS} (shielded)`);
  });

  it("says MAX rather than an amount when everything is being sent", () => {
    expect(format(transaction({ useAllAmount: true }))).toBe(`SEND MAX TO ${T_ADDRESS} (shielded)`);
  });

  it("keeps every zatoshi of the amount, however small the send", () => {
    expect(format(transaction({ amount: new BigNumber(1) }))).toBe(
      `SEND 0.00000001 ZEC TO ${T_ADDRESS} (shielded)`,
    );
  });
});

describe("transaction serialization", () => {
  const raw: TransactionRaw = {
    family: "zcash",
    transferType: "shielded-to-transparent",
    amount: "150000000",
    recipient: T_ADDRESS,
    useAllAmount: false,
    sender: "private",
    recipientType: "public",
    memo: "for coffee",
    zcashFee: "15000",
    changeAmount: "5000",
  } as TransactionRaw;

  it("round-trips a fully populated transaction", () => {
    expect(toTransactionRaw(fromTransactionRaw(raw))).toEqual(raw);
  });

  it("reads the zcash amounts back as BigNumbers", () => {
    const tx = fromTransactionRaw(raw);

    expect(tx.zcashFee).toEqual(new BigNumber(15_000));
    expect(tx.changeAmount).toEqual(new BigNumber(5_000));
    expect(tx).toMatchObject({ sender: "private", recipientType: "public", memo: "for coffee" });
  });

  // An empty memo is a memo: the recipient gets an empty one rather than none,
  // and the conditional spread must not confuse it with an absent field.
  it("round-trips an empty memo and a zero fee", () => {
    const edge = { ...raw, memo: "", zcashFee: "0" };

    expect(toTransactionRaw(fromTransactionRaw(edge))).toMatchObject({ memo: "", zcashFee: "0" });
  });

  // The optional fields are spread conditionally, so an absent one must stay
  // absent rather than round-trip as an explicit `undefined`.
  it.each(["sender", "recipientType", "memo", "zcashFee", "changeAmount"] as const)(
    "leaves %s out when it was never set",
    field => {
      const { [field]: _omitted, ...withoutField } = raw;

      const tx = fromTransactionRaw(withoutField as TransactionRaw);

      expect(tx).not.toHaveProperty(field);
      expect(toTransactionRaw(tx)).not.toHaveProperty(field);
    },
  );
});
