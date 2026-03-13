import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { ChainAPI } from "../../network";
import { estimateFees, estimateTxFee } from "../estimateFees";

jest.mock("../craftTransaction", () => ({
  ...jest.requireActual("../craftTransaction"),
  buildVersionedTransaction: jest.fn(),
}));

jest.mock("../../network/chain/web3", () => ({
  getStakeAccountAddressWithSeed: jest.fn().mockResolvedValue("stakeAccAddress"),
}));

const { buildVersionedTransaction } = jest.requireMock("../craftTransaction");

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

function createMockApi(feeResponses: (number | null)[] = [5000]): ChainAPI {
  let callIdx = 0;
  return {
    getFeeForMessage: jest.fn().mockImplementation(() => {
      const val =
        callIdx < feeResponses.length
          ? feeResponses[callIdx]
          : feeResponses[feeResponses.length - 1];
      callIdx++;
      return Promise.resolve(val);
    }),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: "newBlockhash",
      lastValidBlockHeight: 100,
    }),
  } as unknown as ChainAPI;
}

function setupBuildMock(blockhash = "oldBlockhash") {
  const mockMessage = { recentBlockhash: blockhash };
  const mockOnChainTx = { message: mockMessage };
  buildVersionedTransaction.mockResolvedValue([mockOnChainTx, {}, jest.fn()]);
  return mockOnChainTx;
}

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return estimated fee wrapped as BigInt", async () => {
    const api = createMockApi([5000]);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    });

    expect(result).toEqual({ value: 5000n });
  });

  it("should map token intent to token.transfer kind", async () => {
    const api = createMockApi([5000]);
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "spl-token", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    } as TransactionIntent);

    const tx = buildVersionedTransaction.mock.calls[0][1];
    expect(tx.model.kind).toBe("token.transfer");
  });

  it("should propagate errors from estimateTxFee", async () => {
    buildVersionedTransaction.mockRejectedValueOnce(new Error("RPC error"));

    const api = createMockApi([5000]);
    await expect(
      estimateFees(api, {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("RPC error");
  });

  it("should throw for unsupported intent types", async () => {
    const api = createMockApi([5000]);
    await expect(
      estimateFees(api, {
        intentType: "staking",
        type: "delegate",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      } as any),
    ).rejects.toThrow("Unsupported intent type: staking");
  });
});

describe("estimateTxFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fee for a transfer transaction", async () => {
    const api = createMockApi([5000]);
    setupBuildMock();

    const fee = await estimateTxFee(api, TEST_ADDRESS, "transfer");

    expect(fee).toBe(5000);
    expect(api.getFeeForMessage).toHaveBeenCalledTimes(1);
  });

  it("should retry with new blockhash when first fee is null", async () => {
    jest.useFakeTimers();
    const api = createMockApi([null, 7000]);
    const onChainTx = setupBuildMock();

    const feePromise = estimateTxFee(api, TEST_ADDRESS, "transfer");
    await jest.advanceTimersByTimeAsync(6000);
    const fee = await feePromise;

    expect(fee).toBe(7000);
    expect(api.getFeeForMessage).toHaveBeenCalledTimes(2);
    expect(onChainTx.message.recentBlockhash).toBe("newBlockhash");
    jest.useRealTimers();
  });

  it("should fallback to DEFAULT_TX_FEE (5000) when retry also returns non-number", async () => {
    jest.useFakeTimers();
    const api = createMockApi([null, null]);
    setupBuildMock();

    const feePromise = estimateTxFee(api, TEST_ADDRESS, "transfer");
    await jest.advanceTimersByTimeAsync(6000);
    const fee = await feePromise;

    expect(fee).toBe(5000);
    jest.useRealTimers();
  });

  it.each([
    "transfer",
    "stake.createAccount",
    "stake.delegate",
    "stake.undelegate",
    "stake.withdraw",
    "token.transfer",
    "token.approve",
    "token.revoke",
  ] as const)("should build a %s dummy transaction and return its fee", async kind => {
    const api = createMockApi([5000]);
    setupBuildMock();

    const fee = await estimateTxFee(api, TEST_ADDRESS, kind);

    expect(fee).toBe(5000);
    const tx = buildVersionedTransaction.mock.calls[0][1];
    expect(tx.model.kind).toBe(kind);
  });

  it("should throw for stake.split kind (not implemented)", async () => {
    setupBuildMock();
    const api = createMockApi([5000]);

    await expect(estimateTxFee(api, TEST_ADDRESS, "stake.split")).rejects.toThrow(
      "not implemented",
    );
  });

  it("should throw for token.createATA kind (not implemented)", async () => {
    setupBuildMock();
    const api = createMockApi([5000]);

    await expect(estimateTxFee(api, TEST_ADDRESS, "token.createATA")).rejects.toThrow(
      "not implemented",
    );
  });

  it("should throw for raw kind (not implemented)", async () => {
    setupBuildMock();
    const api = createMockApi([5000]);

    await expect(estimateTxFee(api, TEST_ADDRESS, "raw")).rejects.toThrow("not implemented");
  });

  it("should timeout after 5 retries when blockhash never changes", async () => {
    jest.useFakeTimers();
    const api = {
      getFeeForMessage: jest.fn().mockResolvedValue(null),
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: "oldBlockhash",
        lastValidBlockHeight: 100,
      }),
    } as unknown as ChainAPI;
    setupBuildMock("oldBlockhash");

    const feePromise = estimateTxFee(api, TEST_ADDRESS, "transfer").catch((e: Error) => e);
    await jest.advanceTimersByTimeAsync(30_000);
    const result = await feePromise;

    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe("next blockhash timeout");
    jest.useRealTimers();
  });

  it("should succeed on retry when new blockhash appears after a few attempts", async () => {
    jest.useFakeTimers();
    let blockhashCallCount = 0;
    const api = {
      getFeeForMessage: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(8000),
      getLatestBlockhash: jest.fn().mockImplementation(() => {
        blockhashCallCount++;
        return Promise.resolve({
          blockhash: blockhashCallCount >= 2 ? "freshBlockhash" : "oldBlockhash",
          lastValidBlockHeight: 100,
        });
      }),
    } as unknown as ChainAPI;
    setupBuildMock("oldBlockhash");

    const feePromise = estimateTxFee(api, TEST_ADDRESS, "transfer");
    for (let i = 0; i < 3; i++) {
      await jest.advanceTimersByTimeAsync(6000);
    }
    const fee = await feePromise;

    expect(fee).toBe(8000);
    jest.useRealTimers();
  });

  it("should throw when recentBlockhash is undefined during retry", async () => {
    jest.useFakeTimers();
    const api = createMockApi([null]);
    const mockMessage = { recentBlockhash: undefined };
    const mockOnChainTx = { message: mockMessage };
    buildVersionedTransaction.mockResolvedValue([mockOnChainTx, {}, jest.fn()]);

    await expect(estimateTxFee(api, TEST_ADDRESS, "transfer")).rejects.toThrow(
      "expected recentBlockhash",
    );
    jest.useRealTimers();
  });
});
