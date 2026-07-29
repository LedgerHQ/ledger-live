import { VTHO_ADDRESS } from "@vechain/sdk-core";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { calculateClausesVet, calculateClausesVtho, parseAddress } from "../../common-logic";
import { estimateGas } from "../../common-logic/estimateGas";
import { getThorClient } from "../../common-logic/getThorClient";
import { setCoinConfig } from "../../config";
import { getAccount, getBlockRef } from "../../network";
import { craftTransaction } from "./craftTransaction";

jest.mock("../../common-logic", () => ({
  calculateClausesVet: jest.fn(),
  calculateClausesVtho: jest.fn(),
  generateNonce: jest.fn(() => "0xnonce"),
  parseAddress: jest.fn(() => true),
}));
jest.mock("../../common-logic/estimateGas", () => ({ estimateGas: jest.fn() }));
jest.mock("../../common-logic/getThorClient", () => ({ getThorClient: jest.fn() }));
jest.mock("../../network", () => ({ getAccount: jest.fn(), getBlockRef: jest.fn() }));

const SENDER = "0x0fe6688548f0C303932bB197B0A96034f1d74dba";
const RECIPIENT = "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86";

const NATIVE_INTENT: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 1_000_000_000_000_000_000n,
  asset: { type: "native" },
};

const TOKEN_INTENT: TransactionIntent = {
  ...NATIVE_INTENT,
  asset: { type: "token", assetReference: VTHO_ADDRESS },
};

function mockBuildTransactionBody() {
  return {
    transactions: {
      buildTransactionBody: jest
        .fn()
        .mockResolvedValue({ maxFeePerGas: "1000", maxPriorityFeePerGas: "100" }),
    },
  };
}

describe("craftTransaction", () => {
  beforeEach(() => {
    jest
      .mocked(calculateClausesVet)
      .mockResolvedValue([{ to: RECIPIENT, value: "0x1", data: "0x" }]);
    jest
      .mocked(calculateClausesVtho)
      .mockResolvedValue([{ to: VTHO_ADDRESS, value: 0, data: "0xdata" }]);
    jest.mocked(estimateGas).mockResolvedValue({ totalGas: 21000 } as never);
    jest.mocked(getThorClient).mockReturnValue(mockBuildTransactionBody() as never);
    jest.mocked(getBlockRef).mockResolvedValue("0xblockref12345678");
    setCoinConfig(() => ({ status: { type: "active" } }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("crafts a native VET transaction using calculateClausesVet", async () => {
    const crafted = await craftTransaction(NATIVE_INTENT);

    expect(calculateClausesVet).toHaveBeenCalled();
    expect(calculateClausesVtho).not.toHaveBeenCalled();
    const body = JSON.parse(crafted.transaction);
    expect(body.clauses).toEqual([{ to: RECIPIENT, value: "0x1", data: "0x" }]);
    expect(body.gas).toBe(21000);
    expect(body.nonce).toBe("0xnonce");
    expect(crafted.details?.isTokenAccount).toBe(false);
  });

  it("defaults chainTag to mainnet (74) when the config has no chainTag", async () => {
    const crafted = await craftTransaction(NATIVE_INTENT);

    const body = JSON.parse(crafted.transaction);
    expect(body.chainTag).toBe(74);
  });

  it("uses the config-provided chainTag when set", async () => {
    setCoinConfig(() => ({ status: { type: "active" }, chainTag: 39 }));

    const crafted = await craftTransaction(NATIVE_INTENT);

    const body = JSON.parse(crafted.transaction);
    expect(body.chainTag).toBe(39);
  });

  it("crafts a VTHO transaction using calculateClausesVtho", async () => {
    const crafted = await craftTransaction(TOKEN_INTENT);

    expect(calculateClausesVtho).toHaveBeenCalled();
    expect(calculateClausesVet).not.toHaveBeenCalled();
    expect(crafted.details?.isTokenAccount).toBe(true);
  });

  it("computes the fee as maxFeePerGas * gas", async () => {
    const crafted = await craftTransaction(NATIVE_INTENT);

    expect(crafted.details?.fee).toBe((1000 * 21000).toString());
  });

  it("uses the account balance for the sent asset when useAllAmount is set", async () => {
    jest.mocked(getAccount).mockResolvedValueOnce({
      balance: "0x1000",
      energy: "0x2000",
      hasCode: false,
    });

    await craftTransaction({ ...NATIVE_INTENT, useAllAmount: true, amount: 0n });

    expect(getAccount).toHaveBeenCalledWith(SENDER);
    expect(calculateClausesVet).toHaveBeenCalledWith(RECIPIENT, expect.any(Object));
  });

  it("uses custom fee parameters instead of re-estimating gas when provided", async () => {
    await craftTransaction(NATIVE_INTENT, {
      value: 5000n,
      parameters: { gas: 30000, maxFeePerGas: 50, maxPriorityFeePerGas: 5 },
    });

    expect(estimateGas).not.toHaveBeenCalled();
  });

  it("applies a partial fee override (gas only) over the estimate instead of discarding it", async () => {
    const crafted = await craftTransaction(NATIVE_INTENT, {
      value: 0n,
      parameters: { gas: 30000 },
    });

    expect(estimateGas).toHaveBeenCalled();
    const body = JSON.parse(crafted.transaction);
    expect(body.gas).toBe(30000);
    expect(body.maxFeePerGas).toBe(1000);
    expect(body.maxPriorityFeePerGas).toBe(100);
  });

  it("coerces bigint fee parameters to numbers so the body stays JSON-serializable", async () => {
    // The generic coin-framework hands fee parameters back as bigint; JSON.stringify cannot
    // serialize a bigint, so craftTransaction must coerce them to numbers before building the body.
    const crafted = await craftTransaction(NATIVE_INTENT, {
      value: 5000n,
      parameters: { gas: 30000n, maxFeePerGas: 50n, maxPriorityFeePerGas: 5n },
    } as never);

    const body = JSON.parse(crafted.transaction);
    expect(body.gas).toBe(30000);
    expect(body.maxFeePerGas).toBe(50);
    expect(body.maxPriorityFeePerGas).toBe(5);
    expect(typeof body.gas).toBe("number");
  });

  it("throws when the recipient is missing", async () => {
    await expect(craftTransaction({ ...NATIVE_INTENT, recipient: "" })).rejects.toThrow(
      "vechain: recipient is required",
    );
  });

  it("throws when the sender is not a valid address", async () => {
    jest.mocked(parseAddress).mockReturnValueOnce(false);

    await expect(craftTransaction({ ...NATIVE_INTENT, sender: "0xbad" })).rejects.toThrow(
      "vechain: invalid sender address",
    );
  });

  it("throws when the resolved amount is not positive", async () => {
    await expect(craftTransaction({ ...NATIVE_INTENT, amount: 0n })).rejects.toThrow(
      "vechain: transaction amount must be positive",
    );
  });

  it("reserves the VTHO gas fee for a max VTHO send (amount = energy - fee)", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValueOnce({ balance: "0x0", energy: "0x5F5E100", hasCode: false });

    await craftTransaction({ ...TOKEN_INTENT, useAllAmount: true, amount: 0n });

    const calls = jest.mocked(calculateClausesVtho).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[calls.length - 1][1].toString()).toBe("79000000");
  });

  it("throws when the VTHO balance cannot cover the max-send gas fee", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValueOnce({ balance: "0x0", energy: "0x3E8", hasCode: false });

    await expect(
      craftTransaction({ ...TOKEN_INTENT, useAllAmount: true, amount: 0n }),
    ).rejects.toThrow("vechain: VTHO balance too low to cover the transaction gas fee");
  });

  it("crafts a dust native amount (1 wei)", async () => {
    const crafted = await craftTransaction({ ...NATIVE_INTENT, amount: 1n });

    expect(calculateClausesVet).toHaveBeenCalledWith(RECIPIENT, expect.any(Object));
    expect(JSON.parse(crafted.transaction).gas).toBe(21000);
  });

  it("reserves the fee at the max-VTHO boundary, leaving exactly 1 wei", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValueOnce({ balance: "0x0", energy: "21000001", hasCode: false });

    await craftTransaction({ ...TOKEN_INTENT, useAllAmount: true, amount: 0n });

    const calls = jest.mocked(calculateClausesVtho).mock.calls;
    expect(calls[calls.length - 1][1].toString()).toBe("1");
  });

  it("throws at the max-VTHO boundary where energy exactly equals the fee", async () => {
    jest
      .mocked(getAccount)
      .mockResolvedValueOnce({ balance: "0x0", energy: "21000000", hasCode: false });

    await expect(
      craftTransaction({ ...TOKEN_INTENT, useAllAmount: true, amount: 0n }),
    ).rejects.toThrow("vechain: VTHO balance too low to cover the transaction gas fee");
  });
});
