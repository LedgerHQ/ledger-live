import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { NetworkError } from "../../errors";
import type { ChainAPI } from "../../network";
import { estimateFees, estimateTxFee } from "../estimateFees";

jest.mock("../craftTransaction", () => {
  const actual = jest.requireActual("../craftTransaction");
  return {
    ...actual,
    buildVersionedTransaction: jest.fn(),
    craftTransaction: jest.fn(actual.craftTransaction),
    resolveRecipientDescriptor: jest.fn(actual.resolveRecipientDescriptor),
  };
});

jest.mock("../../network/chain/web3", () => ({
  ...jest.requireActual("../../network/chain/web3"),
  getStakeAccountAddressWithSeed: jest.fn().mockResolvedValue("stakeAccAddress"),
}));

const { buildVersionedTransaction, craftTransaction, resolveRecipientDescriptor } =
  jest.requireMock("../craftTransaction");

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

/** A self-transfer priced at 10,000 µL/CU, after the given limit instructions. */
function pricedTransfer(limitIxs: TransactionInstruction[]): VersionedTransaction {
  const payer = new PublicKey(TEST_ADDRESS);
  return new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer,
      recentBlockhash: PublicKey.default.toBase58(),
      instructions: [
        ...limitIxs,
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        SystemProgram.transfer({ fromPubkey: payer, toPubkey: payer, lamports: 0 }),
      ],
    }).compileToLegacyMessage(),
  );
}
const TEST_RECIPIENT = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

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

const PARTNER_RAW_TX =
  "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";

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
    // Most cases measure the dummy the estimate falls back on; the crafted path has its own cases.
    craftTransaction.mockRejectedValue(new Error("dummy under test"));
  });

  it("signs the budget it estimated, however the fees moved in between", async () => {
    const {
      craftTransaction: craft,
      computeBudgetOf,
      instructionsOfMessage,
    } = jest.requireActual("../craftTransaction");
    craftTransaction.mockImplementation(craft);
    const api = {
      ...createMockApi([5005]),
      config: {},
      getLatestBlockhash: jest.fn().mockResolvedValue({
        blockhash: PublicKey.default.toBase58(),
        lastValidBlockHeight: 100,
      }),
      getRecentPrioritizationFees: jest.fn().mockResolvedValue([{ prioritizationFee: 0 }]),
      getSimulationComputeUnits: jest.fn().mockResolvedValue(450),
    } as unknown as ChainAPI;
    const intent = {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    } as TransactionIntent;

    const estimate = await estimateFees(api, intent);
    (api.getRecentPrioritizationFees as jest.Mock).mockResolvedValue([
      { prioritizationFee: 90_000 },
    ]);
    // The wallet forwards the parameters JSON-safe, bigints as strings.
    const forwarded = JSON.parse(
      JSON.stringify(estimate, (_, value) => (typeof value === "bigint" ? `${value}` : value)),
    );
    const signed = await craft(api, intent, {
      value: estimate.value,
      parameters: forwarded.parameters,
    });

    expect(estimate).toEqual({
      value: 5005n,
      parameters: { computeUnitPrice: 10_000n, computeUnitLimit: 495 },
    });
    const { message } = VersionedTransaction.deserialize(Buffer.from(signed.transaction, "base64"));
    expect(computeBudgetOf(instructionsOfMessage(message))).toEqual({
      computeUnitPrice: 10_000n,
      computeUnitLimit: 495,
    });
    expect(signed.details.estimatedFee).toBe("5005");
  });

  it("lets a network failure while crafting surface rather than estimate on a dummy", async () => {
    craftTransaction.mockRejectedValue(new NetworkError("Too many requests"));

    await expect(
      estimateFees(createMockApi([5000]), {
        intentType: "transaction",
        type: "send",
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow(NetworkError);
    expect(buildVersionedTransaction).not.toHaveBeenCalled();
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

  it("prices the transaction crafting builds and publishes its budget for crafting to sign", async () => {
    const api = createMockApi([5005]);
    const crafted = pricedTransfer([ComputeBudgetProgram.setComputeUnitLimit({ units: 495 })]);
    craftTransaction.mockResolvedValueOnce({
      transaction: Buffer.from(crafted.serialize()).toString("base64"),
      details: { estimatedFee: "5005" },
    });

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
    });

    expect(result).toEqual({
      value: 5005n,
      parameters: { computeUnitPrice: 10_000n, computeUnitLimit: 495 },
    });
    expect(buildVersionedTransaction).not.toHaveBeenCalled();
  });

  it("crafts without a memo too long to fit, which validateIntent reports", async () => {
    const api = createMockApi([5000]);
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
      memo: { type: "string", kind: "text", value: "a".repeat(501) },
    } as TransactionIntent);

    expect(craftTransaction.mock.calls[0][1].memo).toEqual({ type: "none" });
    expect(buildVersionedTransaction.mock.calls[0][1].model.commandDescriptor.command.memo).toBe(
      undefined,
    );
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

  it.each([
    ["native", { type: "native" }],
    [
      "token",
      { type: "spl-token", assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    ],
  ])("prices the memo of a %s transfer, which raises its priority fee", async (_, asset) => {
    const api = createMockApi([5000]);
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset,
      memo: { type: "string", kind: "text", value: "invoice-42" },
    } as TransactionIntent);

    const tx = buildVersionedTransaction.mock.calls[0][1];
    expect(tx.model.commandDescriptor.command.memo).toBe("invoice-42");
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

  it("measures a Token-2022 mint with the Token-2022 dummy, whatever the asset type says", async () => {
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
    expect(command.tokenProgram).toBe("spl-token-2022");
    expect(command.mintAddress).toBe("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  });

  it.each(["token.approve", "token.revoke"] as const)(
    "measures %s on the program the mint is owned by",
    async type => {
      const api = createMockApi([5000]);
      (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token-2022"));
      setupBuildMock();

      await estimateFees(api, {
        intentType: "transaction",
        type,
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        asset: {
          type: "spl-token",
          assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
      } as unknown as TransactionIntent);

      const command = buildVersionedTransaction.mock.calls[0][1].model.commandDescriptor.command;
      expect(command.tokenProgram).toBe("spl-token-2022");
    },
  );

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
      data: { type: "buffer", value: Buffer.from(PARTNER_RAW_TX, "base64") },
    } as unknown as TransactionIntent);

    expect(result).toEqual({ value: 7000n });
    expect(buildVersionedTransaction).not.toHaveBeenCalled();
  });

  it("prices an unsigned partner transaction on a refreshed blockhash", async () => {
    const api = createMockApi([7000]);
    setupBuildMock();

    await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
      data: { type: "buffer", value: Buffer.from(PARTNER_RAW_TX, "base64") },
    } as unknown as TransactionIntent);

    const [message] = (api.getFeeForMessage as jest.Mock).mock.calls[0];
    expect(message.recentBlockhash).toBe("newBlockhash");
  });

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

  it("charges the rent of the token account it opens", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
    (api.getMinimumBalanceForRentExemption as jest.Mock).mockResolvedValue(2_039_280);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "token.createATA",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 0n,
      asset: {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: TEST_ADDRESS,
      },
    } as unknown as TransactionIntent);

    expect(result.value).toBe(5000n + 2_039_280n);
    expect((api.getAccountInfo as jest.Mock).mock.calls).toHaveLength(1);
  });

  it("prices a transfer whose recipient holds another token instead of throwing", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1n,
      asset: {
        type: "spl-token",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: TEST_ADDRESS,
      },
    } as unknown as TransactionIntent);

    expect(result.value).toBe(5000n);
    expect(result.parameters?.recipientTokenAccount).toBeUndefined();
  });

  describe("recipient token destination", () => {
    const splSend = {
      intentType: "transaction",
      type: "send",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1n,
      asset: {
        type: "spl-token",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: TEST_ADDRESS,
      },
    } as unknown as TransactionIntent;

    function mockedApi(): ChainAPI {
      const api = createMockApi([5000]);
      (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
      (api.getMinimumBalanceForRentExemption as jest.Mock).mockResolvedValue(2_039_280);
      setupBuildMock();
      return api;
    }

    it("names an existing token account, with no rent to pay", async () => {
      resolveRecipientDescriptor.mockResolvedValueOnce({
        shouldCreateAsAssociatedTokenAccount: false,
        tokenAccAddress: "recipient-ata",
        walletAddress: TEST_RECIPIENT,
        userInputType: "sol",
      });

      expect(await estimateFees(mockedApi(), splSend)).toEqual({
        value: 5000n,
        parameters: { recipientTokenAccount: "recipient-ata", userInputType: "sol" },
      });
    });

    it("prices the transfer alone when the recipient holds another token", async () => {
      const { SolanaTokenAccountHoldsAnotherToken } = jest.requireActual("../../errors");
      resolveRecipientDescriptor.mockRejectedValueOnce(new SolanaTokenAccountHoldsAnotherToken());

      expect(await estimateFees(mockedApi(), splSend)).toEqual({ value: 5000n });
    });

    it("lets any other failure surface", async () => {
      resolveRecipientDescriptor.mockRejectedValueOnce(new Error("network down"));

      await expect(estimateFees(mockedApi(), splSend)).rejects.toThrow("network down");
    });
  });

  it("charges no rent to approve", async () => {
    const api = createMockApi([5000]);
    (api.getAccountInfo as jest.Mock).mockResolvedValue(mintAccountInfo("spl-token"));
    (api.getMinimumBalanceForRentExemption as jest.Mock).mockResolvedValue(2_039_280);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "transaction",
      type: "token.approve",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000n,
      asset: {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: TEST_ADDRESS,
      },
    } as unknown as TransactionIntent);

    expect(result.value).toBe(5000n);
  });

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

  it("holds back the future undelegate and withdraw on a creation", async () => {
    const api = createMockApi([5000]);
    (api.getMinimumBalanceForRentExemption as jest.Mock).mockResolvedValue(2_282_880);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "staking",
      type: "stake.createAccount",
      mode: "delegate",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      valAddress: TEST_RECIPIENT,
      amount: 0n,
      useAllAmount: true,
      asset: { type: "native" },
    } as StakingTransactionIntent);

    expect(result.parameters?.reserve).toBe(5000n + 10000n);
    expect(result.parameters?.stakeAccountRent).toBe(2_282_880n);
  });

  it("holds nothing back on a split, which opens no new reserve", async () => {
    const api = createMockApi([5000]);
    setupBuildMock();

    const result = await estimateFees(api, {
      intentType: "staking",
      type: "stake.split",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000n,
      asset: { type: "native" },
    } as unknown as StakingTransactionIntent);

    expect(result.parameters?.reserve).toBeUndefined();
  });

  it("resolves the stake account a split opens", async () => {
    const api = createMockApi([5000]);

    const result = await estimateFees(api, {
      intentType: "staking",
      type: "stake.split",
      sender: TEST_ADDRESS,
      recipient: TEST_RECIPIENT,
      amount: 1000000n,
      asset: { type: "native" },
      data: { type: "stakeAccountSeed", value: "seed-abc" },
    } as unknown as StakingTransactionIntent);

    expect(result.parameters?.stakeAccountAddress).toEqual(expect.any(String));
    expect(result.parameters?.stakeAccountRent).toBeUndefined();
  });

  it.each(["stake.createAccount", "stake.withdraw", "stake.split"] as const)(
    "prices %s as a stake kind even though it arrives as a plain transaction intent",
    async type => {
      const api = createMockApi([5000]);
      setupBuildMock();

      await estimateFees(api, {
        intentType: "transaction",
        type,
        sender: TEST_ADDRESS,
        recipient: TEST_RECIPIENT,
        amount: 1000n,
        asset: { type: "native" },
      } as unknown as TransactionIntent);

      expect(buildVersionedTransaction.mock.calls[0][1].model.kind).toBe(type);
    },
  );
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

  it.each([
    ["at its compute-unit limit", [ComputeBudgetProgram.setComputeUnitLimit({ units: 495 })], 5005],
    // The runtime default of two builtins, the transfer and the price: 10,000 µL/CU × 6,000 CU.
    ["at the runtime default without a limit", [], 5060],
  ])(
    "falls back to the base fee plus the priority fee %s when retry also returns non-number",
    async (_, limitIxs, expected) => {
      jest.useFakeTimers();
      const api = createMockApi([null, null]);
      buildVersionedTransaction.mockResolvedValue([pricedTransfer(limitIxs), {}, jest.fn()]);

      const feePromise = estimateTxFee(api, TEST_ADDRESS, "transfer");
      await jest.advanceTimersByTimeAsync(6000);
      const fee = await feePromise;

      expect(fee).toBe(expected);
      jest.useRealTimers();
    },
  );

  it.each([
    "transfer",
    "stake.createAccount",
    "stake.delegate",
    "stake.undelegate",
    "stake.withdraw",
    "token.transfer",
    "token.approve",
    "token.revoke",
    "stake.split",
    "token.createATA",
  ] as const)("should build a %s dummy transaction and return its fee", async kind => {
    const api = createMockApi([5000]);
    setupBuildMock();

    const fee = await estimateTxFee(api, TEST_ADDRESS, kind);

    expect(fee).toBe(5000);
    const tx = buildVersionedTransaction.mock.calls[0][1];
    expect(tx.model.kind).toBe(kind);
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
