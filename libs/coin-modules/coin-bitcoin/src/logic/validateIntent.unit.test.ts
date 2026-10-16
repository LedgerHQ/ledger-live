import { BTC_CHANGE, BTC_RECIPIENT, fakeExplorer } from "../test/fakeExplorer";
import type { BitcoinIntent } from "./intent";
import { validateIntent } from "./validateIntent";
import type { BitcoinIntentInput } from "./types";

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(
    async (_currency: unknown, address: string) => address === "sanctioned",
  ),
}));

const input = (value: string, address = BTC_CHANGE): BitcoinIntentInput => ({
  txid: "aa".repeat(32),
  vout: 0,
  value,
  address,
  path: "84'/0'/0'/0/0",
  blockHeight: 1,
});

const intent = (
  overrides: Partial<BitcoinIntent> = {},
  data: Partial<BitcoinIntent["data"]> = {},
) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: BTC_CHANGE,
    recipient: BTC_RECIPIENT,
    amount: 50_000n,
    asset: { type: "native" },
    ...overrides,
    data: {
      type: "bitcoin",
      derivationMode: "Native SegWit",
      inputs: [input("100000")],
      change: { address: BTC_CHANGE, path: "84'/0'/0'/1/0" },
      feePerByte: "10",
      ...data,
    },
  }) as BitcoinIntent;

const validate = (i: BitcoinIntent) => validateIntent(fakeExplorer(), "bitcoin", i);

describe("validateIntent", () => {
  it("accepts a covered transaction and reports what it spends", async () => {
    const res = await validate(intent());
    expect(res.errors).toEqual({});
    expect(res.amount).toBe(50_000n);
    expect(res.estimatedFees).toBe(1_410n);
    expect(res.totalSpent).toBe(50_000n + 1_410n);
  });

  it.each([
    ["", "RecipientRequired"],
    ["not-an-address", "InvalidAddress"],
  ])("reports the recipient %j", async (recipient, name) => {
    const res = await validate(intent({ recipient }));
    expect(res.errors.recipient?.name).toBe(name);
  });

  it("reports inputs that do not cover the amount", async () => {
    const res = await validate(intent({ amount: 200_000n }));
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("reports a transaction without inputs as not enough balance", async () => {
    const res = await validate(intent({}, { inputs: [] }));
    expect(res.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("requires an amount", async () => {
    const res = await validate(intent({ amount: 0n }));
    expect(res.errors.amount?.name).toBe("AmountRequired");
  });

  it("does not require an amount for a cancel", async () => {
    const res = await validate(intent({ amount: 0n, type: "replace-cancel" }));
    expect(res.errors.amount).toBeUndefined();
  });

  it("computes the send-max amount", async () => {
    const res = await validate(intent({ useAllAmount: true, amount: 0n }));
    expect(res.errors).toEqual({});
    expect(res.amount + res.estimatedFees).toBe(100_000n);
  });

  it.each([
    ["0", "FeeRequired"],
    // the fake explorer relays at 1 sat/vB
    ["0.5", "FeeTooLow"],
  ])("rejects a fee rate of %s", async (feePerByte, name) => {
    const res = await validate(intent({}, { feePerByte }));
    expect(res.errors.feePerByte?.name).toBe(name);
  });

  it("flags an amount under the dust limit", async () => {
    const res = await validate(intent({ amount: 100n }));
    expect(res.errors.dustLimit?.name).toBe("DustLimit");
  });

  it("reads a Ledger Wallet derivation mode as wallet-btc's", async () => {
    const [ledgerWallet, walletBtc] = await Promise.all([
      validate(intent({ amount: 100n }, { derivationMode: "native_segwit" })),
      validate(intent({ amount: 100n })),
    ]);
    expect(ledgerWallet).toEqual(walletBtc);
    expect(ledgerWallet.errors.dustLimit?.name).toBe("DustLimit");
  });

  it("lays out an intent without derivation mode as legacy", async () => {
    const { derivationMode: _, ...data } = intent().data;
    const res = await validate({ ...intent(), data });
    expect(res.errors).toEqual({});
    expect(res.estimatedFees).toBeGreaterThan((await validate(intent())).estimatedFees);
  });

  it("warns about a fee over a tenth of the amount", async () => {
    const res = await validate(intent({ amount: 10_000n }));
    expect(res.warnings.feeTooHigh?.name).toBe("FeeTooHigh");
  });

  it("limits the OP_RETURN payload", async () => {
    const res = await validate(intent({}, { opReturnData: "00".repeat(84) }));
    expect(res.errors.opReturnSizeLimit?.name).toBe("OpReturnDataSizeLimit");
  });

  it("reports sanctioned inputs", async () => {
    const res = await validate(intent({}, { inputs: [input("100000", "sanctioned")] }));
    expect(res.errors.sender?.name).toBe("AddressesSanctionedError");
  });
});
