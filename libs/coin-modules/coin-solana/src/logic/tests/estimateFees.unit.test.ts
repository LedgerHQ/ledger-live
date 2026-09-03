import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import type { ChainAPI } from "../../network";
import { estimateFees, estimateTxFee } from "../estimateFees";

jest.mock("../craftTransaction", () => ({
  ...jest.requireActual("../craftTransaction"),
  buildVersionedTransaction: jest.fn(),
}));

jest.mock("../../network/chain/web3", () => ({
  ...jest.requireActual("../../network/chain/web3"),
  getStakeAccountAddressWithSeed: jest.fn().mockResolvedValue("stakeAccAddress"),
}));

const { buildVersionedTransaction } = jest.requireMock("../craftTransaction");

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

/** The on-chain mint account `getMaybeTokenMint` parses to resolve the token program. */
function mintAccountInfo(program: string, extensions?: unknown[]) {
  return {
    data: {
      parsed: {
        type: "mint",
        info: {
          decimals: 6,
          freezeAuthority: null,
          isInitialized: true,
          mintAuthority: null,
          supply: "1000000000000",
          ...(extensions ? { extensions } : {}),
        },
      },
      program,
      space: 82,
    },
    executable: false,
    lamports: 1461600,
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    rentEpoch: 0,
  };
}

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
    getAccountInfo: jest.fn().mockResolvedValue(null),
    getEpochInfo: jest.fn().mockResolvedValue({ epoch: 0 }),
    // Zero by default so the cases below measure the network fee alone; the ATA-rent case sets it.
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(0),
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

  it("should use spl-token program for standard SPL token intents", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
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
    const command = tx.model.commandDescriptor.command;
    expect(command.tokenProgram).toBe("spl-token");
    expect(command.extensions).toBeUndefined();
  });

  // The transaction measured here is a dummy carrying a random mint, so it stays on the spl-token
  // instruction whatever the asset is -- the Token-2022 builder would resolve that mint on chain.
  it("should measure a Token-2022 intent with the spl-token dummy transaction", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token-2022"));
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "spl", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    } as TransactionIntent);

    const command = buildVersionedTransaction.mock.calls[0][1].model.commandDescriptor.command;
    expect(command.tokenProgram).toBe("spl-token");
    expect(command.extensions).toBeUndefined();
  });

  it("computes the transfer fee of a Token-2022 mint that levies one", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(
      mintAccountInfo("spl-token-2022", [
        {
          extension: "transferFeeConfig",
          state: {
            newerTransferFee: { epoch: 0, maximumFee: 1000000, transferFeeBasisPoints: 100 },
            olderTransferFee: { epoch: 0, maximumFee: 1000000, transferFeeBasisPoints: 100 },
          },
        },
      ]),
    );
    (api.getEpochInfo as jest.Mock).mockResolvedValue({ epoch: 10 });
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "spl", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    } as TransactionIntent);

    expect(result.parameters?.transferFee).toMatchObject({ feeBps: 100, maxTransferFee: 1000000 });
    expect((result.parameters?.transferFee as { transferFee: number }).transferFee).toBeGreaterThan(
      0,
    );
  });

  // A partner-built transaction is measured as-is; nothing is derived from the intent.
  it("measures a partner-built transaction rather than a dummy one", async () => {
    const api = createMockApi([7000]);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
      data: {
        type: "solana",
        raw: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=",
      },
    } as unknown as TransactionIntent);

    expect(result).toEqual({ value: 7000n });
    expect(buildVersionedTransaction).not.toHaveBeenCalled();
  });

  // The rent is not a network fee, but it leaves the sender's account, and legacy reported it here.
  it("adds the recipient's ATA rent when the transfer has to create it", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
    (api.getMinimumBalanceForRentExemption as jest.Mock).mockResolvedValue(2_039_280);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "spl", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    } as TransactionIntent);

    expect(result.value).toBe(5000n + 2_039_280n);
  });

  // A Token-2022 ATA always carries ImmutableOwner, and a transfer-fee mint adds one more account
  // extension, so its rent is sized from the mint rather than from the classic 165-byte account.
  it("sizes the ATA rent from the mint's extensions", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(
      mintAccountInfo("spl-token-2022", [
        {
          extension: "transferFeeConfig",
          state: {
            newerTransferFee: { epoch: 0, maximumFee: 0, transferFeeBasisPoints: 0 },
            olderTransferFee: { epoch: 0, maximumFee: 0, transferFeeBasisPoints: 0 },
          },
        },
      ]),
    );
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "spl", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    } as TransactionIntent);

    const [dataLength] = (api.getMinimumBalanceForRentExemption as jest.Mock).mock.calls[0];
    expect(dataLength).toBeGreaterThan(165);
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

  it("should estimate fees for staking intent types", async () => {
    const api = createMockApi([5000]);
    const result = await estimateFees(api, {
      intentType: "staking",
      type: "stake.createAccount",
      mode: "delegate",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      valAddress: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    } as StakingTransactionIntent);
    expect(result.value).toBe(5000n);
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
