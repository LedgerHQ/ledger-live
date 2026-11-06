import BigNumber from "bignumber.js";
import { getTokenFromAsset } from "./bridge/api";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

jest.mock("./bridge/api", () => ({ getTokenFromAsset: jest.fn() }));

const ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";
const RLUSD_HEX = "524C555344000000000000000000000000000000";

function makeInput({
  amount = new BigNumber(0),
  estimatedFees = new BigNumber(0),
  tag = undefined,
}: {
  amount?: BigNumber;
  estimatedFees?: BigNumber;
  tag?: number | null | undefined;
}) {
  return {
    account: {} as never,
    parentAccount: null,
    transaction: { tag } as Transaction,
    status: { amount, estimatedFees } as TransactionStatus,
  };
}

function toIouAmount(amount: string) {
  return new BigNumber(amount).shiftedBy(38);
}

function mockToken(tokenType: string, tokenIdentifier: string, code = "USD") {
  jest.mocked(getTokenFromAsset).mockResolvedValue({
    tokenType,
    tokenIdentifier,
    contractAddress: ISSUER,
    units: [{ name: code, code, magnitude: 38 }],
  } as never);
}

function getFields({
  transaction,
  amount = new BigNumber(0),
  totalSpent = amount,
}: {
  transaction: Partial<Transaction>;
  amount?: BigNumber;
  totalSpent?: BigNumber;
}) {
  return getDeviceTransactionConfig({
    account: { type: "Account", currency: { id: "ripple" } } as never,
    parentAccount: null,
    transaction: { assetOwner: ISSUER, tag: null, ...transaction } as Transaction,
    status: { amount, totalSpent, estimatedFees: new BigNumber(12) } as TransactionStatus,
  });
}

describe("getDeviceTransactionConfig", () => {
  it("returns no fields when amount and fees are zero and tag is not a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        tag: null,
      }),
    );

    expect(fields).toEqual([]);
  });

  it("returns amount and fees fields when both are non-zero", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(1),
        estimatedFees: new BigNumber(2),
      }),
    );

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("lists the tag before the amount and fees, as app-xrp shows them", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(1),
        estimatedFees: new BigNumber(2),
        tag: 1337,
      }),
    );

    expect(fields).toEqual([
      { type: "text", label: "Tag", value: "1337" },
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("returns tag text field when tag is a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 12345,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "12345" }]);
  });

  it("includes tag when tag is 0", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 0,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "0" }]);
  });
});

describe("getDeviceTransactionConfig for a token", () => {
  it("lists an IOU send's tag, issuer, fees and send max in app-xrp order", async () => {
    mockToken("iou", "USD");

    const fields = await getFields({
      transaction: { assetReference: "USD", tag: 7 },
      amount: toIouAmount("2.5"),
      totalSpent: toIouAmount("2.6"),
    });

    expect(fields).toEqual([
      { type: "text", label: "Tag", value: "7" },
      { type: "amount", label: "Amount" },
      { type: "text", label: "Issuer", value: ISSUER },
      { type: "fees", label: "Fees" },
      { type: "text", label: "Send Max", value: expect.stringMatching(/^2\.6\sUSD$/) },
    ]);
  });

  it("shows a 40-hex currency as text, and no send max when it equals the amount", async () => {
    mockToken("iou", RLUSD_HEX, "RLUSD");

    const fields = await getFields({
      transaction: { assetReference: RLUSD_HEX },
      amount: toIouAmount("2.5"),
    });

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "text", label: "Currency", value: "RLUSD" },
      { type: "text", label: "Issuer", value: ISSUER },
      { type: "fees", label: "Fees" },
    ]);
  });

  it.each([
    ["is not text", "0158415500000000C1F76FF6ECB0BAC600000000"],
    ["names XRP", "5852505800000000000000000000000000000000"],
  ])("shows a 40-hex currency as hex when it %s", async (_, hexCode) => {
    mockToken("iou", hexCode);

    const fields = await getFields({
      transaction: { assetReference: hexCode },
      amount: toIouAmount("1"),
    });

    expect(fields).toContainEqual({ type: "text", label: "Currency", value: hexCode });
  });

  it("lists an opt-in's issuer and limit, with no amount", async () => {
    mockToken("iou", "USD");

    const fields = await getFields({
      transaction: {
        mode: "changeTrust",
        assetReference: "USD",
        amount: toIouAmount("1000"),
      },
    });

    expect(fields).toEqual([
      { type: "text", label: "Limit Amount", value: expect.stringMatching(/^1,?000\sUSD$/) },
      { type: "text", label: "Issuer", value: ISSUER },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("lists no token field for an MPT", async () => {
    mockToken("mpt", "0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47");

    const fields = await getFields({
      transaction: { assetReference: "0000012FFD9EE5DA93AC614B4DB94D7E0FCE415CA51BED47" },
      amount: new BigNumber(5),
    });

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });
});
