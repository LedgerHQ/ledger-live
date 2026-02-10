import { getRevealFee } from "@taquito/taquito";
import coinConfig from "../config";
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

describe("estimateFees", () => {
  const mockTezosToolkit = {
    estimate: {
      setDelegate: jest.fn(),
      transfer: jest.fn(),
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
