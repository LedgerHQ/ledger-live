import { TransactionIntent } from "@ledgerhq/coin-framework/lib-es/api/types";
import { XrpMapMemo } from "../types";
import { XrpInvalidMemoError } from "./errors";
import * as utils from "./utils";
import { validateIntent } from "./validateIntent";
import * as logicValidateMemo from "./validateMemo";

const mockGetBalance = jest.fn();

const mockGetServerInfos = jest.fn();

jest.mock("./getBalance", () => ({
  getBalance: () => mockGetBalance(),
}));

jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
}));

jest.spyOn(utils, "cachedRecipientIsNew").mockImplementation(addr => {
  if (addr === RECIPIENT_NEW) {
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
});

const reserveBase = 10_000_000n; // 10 XRP (drops)

const SENDER = "rPSCfmnX3t9jQJG5RNcZtSaP5UhExZDue4";
const RECIPIENT = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";
const RECIPIENT_NEW = "rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK";

describe("validateIntent", () => {
  const spiedValidateMemo = jest.spyOn(logicValidateMemo, "validateMemo");

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns no errors on valid transaction", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n, // XRP value, not drops
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 20_000_000n,
        recipient: RECIPIENT,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      {
        value: 10_000n, // fees
      },
    );

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.totalSpent).toBe(20_010_000n);
  });

  it("throws FeeTooHigh warning when fee is >10% of amount", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 1_000_000n,
        recipient: RECIPIENT,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      {
        value: 200_000n, // fees
      },
    );

    expect(result.warnings.feeTooHigh).toBeInstanceOf(Error);
    expect(result.errors).toEqual({});
  });

  it("errors when fee is missing", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 30_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 10_000_000n,
        recipient: RECIPIENT,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
    );

    expect(result.errors.fee?.name).toBe("FeeNotLoaded");
  });

  it("errors if recipient is same as sender", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 10_000_000n,
        recipient: SENDER,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      { value: 10_000n }, // fees
    );

    expect(result.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("errors if recipient is new and amount is too low", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 5_000_000n,
        recipient: RECIPIENT_NEW,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      { value: 10_000n }, // fees
    );

    expect(result.errors.amount?.name).toBe("NotEnoughBalanceBecauseDestinationNotCreated");
  });

  it("errors if amount is zero", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        amount: 0n,
        recipient: RECIPIENT,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      { value: 10_000n }, // fees
    );

    expect(result.errors.amount?.name).toBe("AmountRequired");
  });

  it("errors if recipient is invalid", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        amount: 1_000_000n,
        recipient: "not-an-address",
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      { value: 10_000n }, // fees
    );

    expect(result.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("errors if recipient is missing", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n,
        },
      },
    });
    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    const result = await validateIntent(
      // account as any,
      {
        intentType: "transaction",
        sender: SENDER,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        amount: 1_000_000n,
        recipient: "",
        memo: {
          type: "",
          memos: new Map<string, Record<string, unknown>>(),
        },
      } as any,
      { value: 10_000n }, // fees
    );

    expect(result.errors.recipient?.name).toBe("RecipientRequired");
  });

  it("should not set error on transaction when memo is validated", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n, // XRP value, not drops
        },
      },
    });

    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    spiedValidateMemo.mockReturnValueOnce(true);

    const memos = new Map<string, string | string[]>();
    memos.set("destinationTag", "random memo for unit test");

    const status = await validateIntent(
      {
        intentType: "transaction",
        sender: SENDER,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        amount: 1_000_000n,
        recipient: "",
        memo: {
          type: "",
          memos,
        },
      } as TransactionIntent<XrpMapMemo>,
      { value: 10_000n },
    );
    expect(status.errors.transaction).not.toBeDefined();

    expect(spiedValidateMemo).toHaveBeenCalledWith(memos.get("destinationTag"));
  });

  it("should set error on transaction when memo is invalidated", async () => {
    mockGetServerInfos.mockResolvedValue({
      info: {
        validated_ledger: {
          reserve_base_xrp: reserveBase / 1_000_000n, // XRP value, not drops
        },
      },
    });

    mockGetBalance.mockResolvedValue([
      {
        value: 50_000_000n,
        asset: { type: "native" },
        locked: 0n,
      },
    ]);

    spiedValidateMemo.mockReturnValueOnce(false);

    const memos = new Map<string, string | string[]>();
    memos.set("destinationTag", "random memo for unit test");

    const status = await validateIntent(
      {
        intentType: "transaction",
        sender: SENDER,
        asset: { unit: { code: "XRP", magnitude: 6 } },
        amount: 1_000_000n,
        recipient: "",
        memo: {
          type: "",
          memos,
        },
      } as TransactionIntent<XrpMapMemo>,
      { value: 10_000n },
    );
    expect(status.errors.transaction).toBeInstanceOf(XrpInvalidMemoError);

    expect(spiedValidateMemo).toHaveBeenCalledWith(memos.get("destinationTag"));
  });
});
