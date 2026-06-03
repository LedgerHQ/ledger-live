import { getRevealFee } from "@taquito/taquito";
import coinConfig from "../config";
import { STAKE_USE_ALL_RESERVE_MUTEZ } from "../utils";
import { estimateFees } from "./estimateFees";
import { getTezosToolkit } from "./tezosToolkit";

jest.mock("./tezosToolkit");
jest.mock("../config", () => ({
  __esModule: true,
  default: { getCoinConfig: jest.fn() },
}));

const defaultFeesConfig = {
  minGasLimit: 600,
  minRevealGasLimit: 300,
  minStorageLimit: 0,
  minFees: 0,
  minEstimatedFees: 1000,
};

const unrevealedAccount = {
  address: "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V",
  balance: BigInt(1000000),
  revealed: false,
  xpub: "021bab48f41fc555e0fcf322a28e31b56f4369242f65324758ec8bbae3e84109a5",
};

const revealedAccount = {
  ...unrevealedAccount,
  revealed: true,
};

function setupFa2ContractMock() {
  const toTransferParams = jest.fn().mockReturnValue({
    parameter: { entrypoint: "transfer", value: [] },
    amount: 0,
    mutez: true,
  });
  const transfer = jest.fn().mockReturnValue({ toTransferParams });
  return { transfer, toTransferParams };
}

describe("estimateFees", () => {
  const mockTezosToolkit = {
    estimate: {
      finalizeUnstake: jest.fn(),
      setDelegate: jest.fn(),
      stake: jest.fn(),
      transfer: jest.fn(),
      unstake: jest.fn(),
    },
    contract: {
      at: jest.fn(),
    },
    setProvider: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getTezosToolkit as jest.Mock).mockReturnValue(mockTezosToolkit);
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: defaultFeesConfig,
    });
  });

  describe("when suggested fee is above or below minFees floor", () => {
    it("estimate fees when default estimation is greater than minFees", async () => {
      const suggestedFee = 2000;
      const minFees = 1000;
      mockTezosToolkit.estimate.setDelegate.mockResolvedValue({
        suggestedFeeMutez: suggestedFee,
        gasLimit: 10000,
        storageLimit: 0,
        burnFeeMutez: 0,
        opSize: 100,
      });
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: { ...defaultFeesConfig, minFees },
      });

      const result = await estimateFees({
        account: revealedAccount,
        transaction: {
          mode: "delegate",
          recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
          amount: BigInt(0),
        },
      });

      expect(result.fees).toBe(BigInt(suggestedFee));
      expect(result.estimatedFees).toBe(BigInt(suggestedFee));
    });

    it("estimate fees when default estimation is lesser than minFees", async () => {
      const minFees = 1000;
      mockTezosToolkit.estimate.setDelegate.mockResolvedValue({
        suggestedFeeMutez: 100,
        gasLimit: 10000,
        storageLimit: 0,
        burnFeeMutez: 0,
        opSize: 100,
      });
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: { ...defaultFeesConfig, minFees },
      });

      const result = await estimateFees({
        account: revealedAccount,
        transaction: {
          mode: "delegate",
          recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
          amount: BigInt(0),
        },
      });

      expect(result.fees).toBe(BigInt(minFees));
      expect(result.estimatedFees).toBe(BigInt(minFees));
    });

    it("estimate fees when default estimation is lesser than minFees (unrevealed composite)", async () => {
      const minFees = 1000;
      mockTezosToolkit.estimate.setDelegate.mockResolvedValue({
        suggestedFeeMutez: 100,
        gasLimit: 10000,
        storageLimit: 0,
        burnFeeMutez: 0,
        opSize: 100,
      });
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: { ...defaultFeesConfig, minFees },
      });

      const account = { ...unrevealedAccount };
      const transaction = {
        mode: "delegate" as const,
        recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
        amount: BigInt(0),
      };

      const result = await estimateFees({ account, transaction });

      expect(result.fees).toBe(BigInt(minFees));
      expect(result.estimatedFees).toBe(BigInt(minFees * 2));
    });
  });

  it("uses getRevealFee for unrevealed account when minFees is 0", async () => {
    const delegationFee = 500;
    mockTezosToolkit.estimate.setDelegate.mockResolvedValue({
      suggestedFeeMutez: delegationFee,
      gasLimit: 10000,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 100,
    });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: { ...defaultFeesConfig, minFees: 0, minEstimatedFees: 0 },
    });

    const account = { ...unrevealedAccount };
    const transaction = {
      mode: "delegate" as const,
      recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
      amount: BigInt(0),
    };

    const result = await estimateFees({ account, transaction });

    const expectedRevealFee = getRevealFee(account.address);
    expect(result.estimatedFees).toBe(BigInt(delegationFee + expectedRevealFee));
  });

  it("undelegate uses same fee logic as delegate", async () => {
    const suggestedFee = 800;
    mockTezosToolkit.estimate.setDelegate.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 10000,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "undelegate",
        recipient: "",
        amount: BigInt(0),
      },
    });

    expect(result.fees).toBe(BigInt(suggestedFee));
    expect(result.estimatedFees).toBe(BigInt(suggestedFee));
    expect(mockTezosToolkit.estimate.setDelegate).toHaveBeenCalledWith({
      source: revealedAccount.address,
    });
  });

  it("stake uses Taquito stake estimation and maps fee fields", async () => {
    mockTezosToolkit.estimate.stake.mockResolvedValue({
      suggestedFeeMutez: 700,
      gasLimit: 1100,
      storageLimit: 5,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "stake",
        recipient: "",
        amount: 1234n,
      },
    });

    expect(mockTezosToolkit.estimate.stake).toHaveBeenCalledWith({
      amount: 1234,
      mutez: true,
    });
    expect(result.fees).toBe(700n);
    expect(result.gasLimit).toBe(1100n);
    expect(result.storageLimit).toBe(5n);
    expect(result.estimatedFees).toBe(700n);
    expect(result.amount).toBe(1234n);
  });

  it("unstake uses Taquito unstake estimation and maps fee fields", async () => {
    mockTezosToolkit.estimate.unstake.mockResolvedValue({
      suggestedFeeMutez: 710,
      gasLimit: 1200,
      storageLimit: 6,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "unstake",
        recipient: "",
        amount: 4321n,
      },
    });

    expect(mockTezosToolkit.estimate.unstake).toHaveBeenCalledWith({
      amount: 4321,
      mutez: true,
    });
    expect(result.fees).toBe(710n);
    expect(result.gasLimit).toBe(1200n);
    expect(result.storageLimit).toBe(6n);
    expect(result.estimatedFees).toBe(710n);
    expect(result.amount).toBe(4321n);
  });

  it("useAllAmount stake coerces amount to 1 for estimation and resolves max to balance minus fees and reserve", async () => {
    const suggestedFee = 700;
    const balance = 1_000_000n;
    mockTezosToolkit.estimate.stake.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 1100,
      storageLimit: 5,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: { ...revealedAccount, balance },
      transaction: {
        mode: "stake",
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      },
    });

    expect(mockTezosToolkit.estimate.stake).toHaveBeenCalledWith({
      amount: 1,
      mutez: true,
    });
    expect(result.fees).toBe(BigInt(suggestedFee));
    expect(result.amount).toBe(balance - BigInt(suggestedFee) - 10_000n);
  });

  it("useAllAmount stake subtracts reveal fee from maxStakable on unrevealed accounts", async () => {
    const suggestedFee = 700;
    const balance = 1_000_000n;
    mockTezosToolkit.estimate.stake.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 1100,
      storageLimit: 5,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: { ...unrevealedAccount, balance },
      transaction: {
        mode: "stake",
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      },
    });

    const expectedRevealFee = BigInt(getRevealFee(unrevealedAccount.address));
    expect(result.amount).toBe(balance - BigInt(suggestedFee) - expectedRevealFee - 10_000n);
    expect(result.amount! + result.estimatedFees).toBeLessThanOrEqual(balance);
  });

  it("useAllAmount stake clamps amount to 0 when balance cannot cover fees and reserve", async () => {
    const suggestedFee = 700;
    const balance = 5_000n;
    mockTezosToolkit.estimate.stake.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 1100,
      storageLimit: 5,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: { ...revealedAccount, balance },
      transaction: {
        mode: "stake",
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      },
    });

    expect(result.amount).toBe(0n);
  });

  it("useAllAmount stake excludes already-staked funds from maxStakable", async () => {
    const suggestedFee = 700;
    const balance = 1_000_000n;
    const stakedBalance = 300_000n;
    mockTezosToolkit.estimate.stake.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 1100,
      storageLimit: 5,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: { ...revealedAccount, balance, stakedBalance },
      transaction: {
        mode: "stake",
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      },
    });

    expect(result.amount).toBe(
      balance - stakedBalance - BigInt(suggestedFee) - STAKE_USE_ALL_RESERVE_MUTEZ,
    );
  });

  it("useAllAmount unstake coerces amount to 1 for Taquito estimation", async () => {
    mockTezosToolkit.estimate.unstake.mockResolvedValue({
      suggestedFeeMutez: 710,
      gasLimit: 1200,
      storageLimit: 6,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "unstake",
        recipient: "",
        amount: 0n,
        useAllAmount: true,
      },
    });

    expect(mockTezosToolkit.estimate.unstake).toHaveBeenCalledWith({
      amount: 1,
      mutez: true,
    });
    expect(result.fees).toBe(710n);
    expect(result.amount).toBe(0n);
  });

  it("finalize_unstake uses Taquito finalizeUnstake estimation and maps fee fields", async () => {
    mockTezosToolkit.estimate.finalizeUnstake.mockResolvedValue({
      suggestedFeeMutez: 720,
      gasLimit: 1300,
      storageLimit: 7,
      burnFeeMutez: 0,
      opSize: 100,
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "finalize_unstake",
        recipient: "",
        amount: 0n,
      },
    });

    expect(mockTezosToolkit.estimate.finalizeUnstake).toHaveBeenCalledWith({});
    expect(result.fees).toBe(720n);
    expect(result.gasLimit).toBe(1300n);
    expect(result.storageLimit).toBe(7n);
    expect(result.estimatedFees).toBe(720n);
    expect(result.amount).toBe(0n);
  });

  it("transfer (send) applies minFees and returns gas/storage from estimate", async () => {
    const suggestedFee = 350;
    const minFees = 500;
    mockTezosToolkit.estimate.transfer.mockResolvedValue({
      suggestedFeeMutez: suggestedFee,
      gasLimit: 1500,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 200,
    });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: { ...defaultFeesConfig, minFees },
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "send",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(1000),
      },
    });

    expect(result.fees).toBe(BigInt(minFees));
    expect(result.estimatedFees).toBe(BigInt(minFees));
    expect(result.gasLimit).toBe(1500n);
    expect(result.storageLimit).toBe(0n);
    expect(result.amount).toBe(1000n);
  });

  it("transfer (send) unrevealed adds reveal fee to estimatedFees", async () => {
    const transferFee = 400;
    mockTezosToolkit.estimate.transfer.mockResolvedValue({
      suggestedFeeMutez: transferFee,
      gasLimit: 1500,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 200,
    });

    const result = await estimateFees({
      account: unrevealedAccount,
      transaction: {
        mode: "send",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(1000),
      },
    });

    const expectedRevealFee = getRevealFee(unrevealedAccount.address);
    expect(result.fees).toBe(BigInt(transferFee));
    expect(result.estimatedFees).toBe(BigInt(transferFee + expectedRevealFee));
  });

  it("returns zero estimation when balance is 0 and not useAllAmount", async () => {
    const result = await estimateFees({
      account: { ...revealedAccount, balance: 0n },
      transaction: {
        mode: "delegate",
        recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
        amount: BigInt(0),
      },
    });

    expect(result.fees).toBe(0n);
    expect(result.estimatedFees).toBe(0n);
    expect(mockTezosToolkit.estimate.setDelegate).not.toHaveBeenCalled();
  });

  it("returns estimation with amount 0 when balance is 0 and useAllAmount", async () => {
    const result = await estimateFees({
      account: { ...revealedAccount, balance: 0n },
      transaction: {
        mode: "send",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(0),
        useAllAmount: true,
      },
    });

    expect(result.amount).toBe(0n);
    expect(mockTezosToolkit.estimate.transfer).not.toHaveBeenCalled();
  });

  it("returns fallback estimation when send has no recipient", async () => {
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: {
        ...defaultFeesConfig,
        minEstimatedFees: 300,
        minGasLimit: 600,
        minStorageLimit: 0,
      },
    });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "send",
        recipient: "",
        amount: BigInt(100),
        useAllAmount: false,
      },
    });

    expect(result.fees).toBe(300n);
    expect(result.estimatedFees).toBe(300n);
    expect(result.gasLimit).toBe(600n);
    expect(mockTezosToolkit.estimate.transfer).not.toHaveBeenCalled();
  });

  it("uses fallback estimation and adds reveal fee when Taquito throws Public key not found (unrevealed)", async () => {
    const minEstimatedFees = 400;
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: {
        ...defaultFeesConfig,
        minEstimatedFees,
        minGasLimit: 600,
        minStorageLimit: 0,
      },
    });
    mockTezosToolkit.estimate.transfer.mockRejectedValue(
      Object.assign(new Error("Fail"), { status: 404, message: "Public key not found" }),
    );

    const result = await estimateFees({
      account: unrevealedAccount,
      transaction: {
        mode: "send",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(100),
      },
    });

    const expectedRevealFee = getRevealFee(unrevealedAccount.address);
    expect(result.fees).toBe(BigInt(minEstimatedFees));
    expect(result.estimatedFees).toBe(BigInt(minEstimatedFees + expectedRevealFee));
  });

  it("send_token (FA2) revealed applies estimation from contract transfer", async () => {
    const { transfer } = setupFa2ContractMock();
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });
    mockTezosToolkit.estimate.transfer.mockResolvedValue({
      suggestedFeeMutez: 600,
      gasLimit: 5000,
      storageLimit: 10,
      burnFeeMutez: 0,
      opSize: 250,
    });

    const contractAddress = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "send_token",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(100),
        contractAddress,
        tokenId: 0,
      },
    });

    expect(mockTezosToolkit.contract.at).toHaveBeenCalledWith(contractAddress);
    expect(transfer).toHaveBeenCalledWith([
      {
        from_: revealedAccount.address,
        txs: [{ to_: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr", token_id: 0, amount: 100n }],
      },
    ]);
    expect(result.fees).toBe(600n);
    expect(result.gasLimit).toBe(5000n);
    expect(result.storageLimit).toBe(10n);
    expect(result.estimatedFees).toBe(600n);
    expect(result.amount).toBe(100n);
  });

  it("send_token unrevealed adds reveal fee to estimatedFees", async () => {
    const { transfer } = setupFa2ContractMock();
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });
    mockTezosToolkit.estimate.transfer.mockResolvedValue({
      suggestedFeeMutez: 400,
      gasLimit: 4000,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 200,
    });

    const contractAddress = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
    const result = await estimateFees({
      account: unrevealedAccount,
      transaction: {
        mode: "send_token",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(50),
        contractAddress,
        tokenId: 3,
      },
    });

    const expectedRevealFee = getRevealFee(unrevealedAccount.address);
    expect(result.fees).toBe(400n);
    expect(result.estimatedFees).toBe(BigInt(400 + expectedRevealFee));
  });

  it("send_token uses fallback when Taquito throws Public key not found", async () => {
    const minEstimatedFees = 400;
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: {
        ...defaultFeesConfig,
        minEstimatedFees,
        minGasLimit: 600,
        minStorageLimit: 0,
      },
    });
    const { transfer } = setupFa2ContractMock();
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });
    mockTezosToolkit.estimate.transfer.mockRejectedValue(
      Object.assign(new Error("Fail"), { status: 404, message: "Public key not found" }),
    );

    const contractAddress = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
    const result = await estimateFees({
      account: unrevealedAccount,
      transaction: {
        mode: "send_token",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(10),
        contractAddress,
        tokenId: 0,
      },
    });

    const expectedRevealFee = getRevealFee(unrevealedAccount.address);
    expect(result.fees).toBe(BigInt(minEstimatedFees));
    expect(result.estimatedFees).toBe(BigInt(minEstimatedFees + expectedRevealFee));
    expect(result.amount).toBe(10n);
  });

  it("send_token with empty recipient returns fallback without calling the contract", async () => {
    const { transfer } = setupFa2ContractMock();
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });

    const result = await estimateFees({
      account: revealedAccount,
      transaction: {
        mode: "send_token",
        recipient: "",
        amount: BigInt(100),
        contractAddress: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU",
        tokenId: 0,
      },
    });

    expect(mockTezosToolkit.contract.at).not.toHaveBeenCalled();
    expect(result.fees).toBe(BigInt(defaultFeesConfig.minEstimatedFees));
    expect(transfer).not.toHaveBeenCalled();
  });

  it("send_token propagates error when contract.at fails", async () => {
    mockTezosToolkit.contract.at.mockRejectedValue(new Error("Invalid contract"));

    await expect(
      estimateFees({
        account: revealedAccount,
        transaction: {
          mode: "send_token",
          recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
          amount: BigInt(1),
          contractAddress: "KT1Bad",
          tokenId: 0,
        },
      }),
    ).rejects.toThrow("Invalid contract");
  });

  it("send_token throws when contractAddress or tokenId is missing", async () => {
    await expect(
      estimateFees({
        account: revealedAccount,
        transaction: {
          mode: "send_token",
          recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
          amount: BigInt(1),
          tokenId: 0,
        },
      }),
    ).rejects.toThrow("FA2 transfer requires contractAddress and tokenId");
  });

  it("useAllAmount send computes max amount and applies minFees to main op", async () => {
    const minFees = 500;
    const balance = 10000;
    mockTezosToolkit.estimate.transfer.mockResolvedValue({
      suggestedFeeMutez: 100,
      gasLimit: 1500,
      storageLimit: 0,
      burnFeeMutez: 0,
      opSize: 200,
    });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: { ...defaultFeesConfig, minFees },
    });

    const result = await estimateFees({
      account: { ...revealedAccount, balance: BigInt(balance) },
      transaction: {
        mode: "send",
        recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
        amount: BigInt(0),
        useAllAmount: true,
      },
    });

    expect(result.fees).toBe(BigInt(minFees));
    expect(result.amount).not.toBeUndefined();
    expect(result.amount!).toBeLessThanOrEqual(BigInt(balance));
  });
});
