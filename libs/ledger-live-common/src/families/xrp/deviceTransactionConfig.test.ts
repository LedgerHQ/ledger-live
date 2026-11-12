import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import getDeviceTransactionConfig, { toDeviceCurrency } from "./deviceTransactionConfig";
import { getMaxTrustLimitForToken } from "./logicPublic";
import type { Transaction, TransactionStatus } from "./types";

const ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";
const RLUSD_CODE = "524C555344000000000000000000000000000000";
const FEES = new BigNumber(12);

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

function makeTokenAccount(tokenType: string, tokenIdentifier: string, code: string) {
  return {
    type: "TokenAccount",
    token: {
      tokenType,
      tokenIdentifier,
      contractAddress: ISSUER,
      units: [{ code, name: code, magnitude: 38 }],
    },
  } as unknown as TokenAccount;
}

function makeChangeTrustInput(assetReference: string, limit: BigNumber) {
  return {
    account: { type: "Account" } as never,
    parentAccount: null,
    transaction: {
      assetReference,
      family: "xrp",
      mode: "changeTrust",
      assetOwner: ISSUER,
      amount: limit,
    } as Transaction,
    status: {
      amount: new BigNumber(0),
      totalSpent: FEES,
      estimatedFees: FEES,
    } as TransactionStatus,
  };
}

function toIouAmount(value: string) {
  return new BigNumber(value).shiftedBy(38);
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

describe("getDeviceTransactionConfig for an IOU send", () => {
  it("lists Amount, Issuer, Tag and Fees for a 3-character code, without Send Max at no issuer fee", async () => {
    const amount = toIouAmount("10");

    const fields = await getDeviceTransactionConfig({
      account: makeTokenAccount("iou", "USD", "USD"),
      parentAccount: null,
      transaction: { family: "xrp", tag: 7 } as Transaction,
      status: {
        amount,
        totalSpent: amount,
        estimatedFees: FEES,
      } as TransactionStatus,
    });

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "address", label: "Issuer", address: ISSUER },
      { type: "text", label: "Tag", value: "7" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("adds Currency for a 40-hex code and Send Max when the issuer takes a fee", async () => {
    const fields = await getDeviceTransactionConfig({
      account: makeTokenAccount("iou", RLUSD_CODE, "RLUSD"),
      parentAccount: null,
      transaction: { family: "xrp" } as Transaction,
      status: {
        amount: toIouAmount("10"),
        totalSpent: toIouAmount("10.05"),
        estimatedFees: FEES,
      } as TransactionStatus,
    });

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "text", label: "Currency", value: "RLUSD" },
      { type: "address", label: "Issuer", address: ISSUER },
      { type: "text", label: "Send Max", value: expect.stringMatching(/^10\.05\sRLUSD$/) },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("lists no IOU field for an MPT send", async () => {
    const fields = await getDeviceTransactionConfig({
      account: makeTokenAccount("mpt", "0".repeat(48), "MPT"),
      parentAccount: null,
      transaction: { family: "xrp" } as Transaction,
      status: {
        amount: new BigNumber(5),
        totalSpent: new BigNumber(5),
        estimatedFees: FEES,
      } as TransactionStatus,
    });

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });
});

describe("getDeviceTransactionConfig for an opt-in or an edit", () => {
  it("lists Limit Amount with the code first, Issuer and Fees", async () => {
    const fields = await getDeviceTransactionConfig(
      makeChangeTrustInput("USD", toIouAmount("1000")),
    );

    expect(fields).toEqual([
      { type: "text", label: "Limit Amount", value: "USD 1000" },
      { type: "address", label: "Issuer", address: ISSUER },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("shows only the digits of a 40-hex code's limit, its code in Currency", async () => {
    const fields = await getDeviceTransactionConfig(
      makeChangeTrustInput(RLUSD_CODE, toIouAmount("1234.5")),
    );

    expect(fields).toEqual([
      { type: "text", label: "Limit Amount", value: "1234.5" },
      { type: "text", label: "Currency", value: "RLUSD" },
      { type: "address", label: "Issuer", address: ISSUER },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("lists only Fees for an MPT opt-in, which sets no limit", async () => {
    const fields = await getDeviceTransactionConfig(
      makeChangeTrustInput("0".repeat(47) + "A", new BigNumber(0)),
    );

    expect(fields).toEqual([{ type: "fees", label: "Fees" }]);
  });

  it("shows the maximum limit as 96 digits, without grouping", async () => {
    const fields = await getDeviceTransactionConfig(
      makeChangeTrustInput(RLUSD_CODE, getMaxTrustLimitForToken()),
    );

    expect(fields[0]).toMatchObject({
      label: "Limit Amount",
      value: expect.stringMatching(/^\d{96}$/),
    });
  });
});

describe("toDeviceCurrency", () => {
  it.each([
    [RLUSD_CODE, "RLUSD"],
    ["0158415500000000C1F76FF6ECB0BAC600000000", "0158415500000000c1f76ff6ecb0bac600000000"],
    ["5852504C55530000000000000000000000000000", "5852504c55530000000000000000000000000000"],
    ["524C55534452524C55534452524C55534452524C", "524c55534452524c55534452524c55534452524c"],
  ])("prints %s as %s", (code, printed) => {
    expect(toDeviceCurrency(code)).toBe(printed);
  });
});
