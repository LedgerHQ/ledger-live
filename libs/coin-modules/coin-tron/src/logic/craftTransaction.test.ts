import type { TronCoinConfig } from "../config";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import {
  claimRewardTronTransaction,
  craftStandardTransaction,
  craftTrc20Transaction,
  freezeTronTransaction,
  legacyUnfreezeTronTransaction,
  unDelegateResourceTransaction,
  unfreezeTronTransaction,
  voteTronSuperRepresentatives,
  withdrawExpireUnfreezeTronTransaction,
} from "../network";
import { decode58Check } from "../network/format";
import type { TronMemo, TronTxData } from "../types";
import { craftTransaction } from "./craftTransaction";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

jest.mock("../network/format", () => ({
  decode58Check: jest.fn(),
}));

jest.mock("../network", () => ({
  // Mirrors the real constant; `craftTransaction.integ.test.ts` asserts the crafted `fee_limit`
  // against the module's own export, so a change to it can't silently pass here.
  DEFAULT_TRC20_FEES_LIMIT: 50000000,
  post: jest.fn(),
  extendTronTxExpirationTimeBy10mn: jest.fn(),
  craftStandardTransaction: jest.fn(),
  craftTrc20Transaction: jest.fn(),
  claimRewardTronTransaction: jest.fn(),
  freezeTronTransaction: jest.fn(),
  legacyUnfreezeTronTransaction: jest.fn(),
  unDelegateResourceTransaction: jest.fn(),
  unfreezeTronTransaction: jest.fn(),
  voteTronSuperRepresentatives: jest.fn(),
  withdrawExpireUnfreezeTronTransaction: jest.fn(),
}));

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should craft a standard transaction", async () => {
    const transactionIntent: TronIntent = {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
      data: { type: "tron" },
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftStandardTransaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const { transaction: result } = await craftTransaction(mockConfig, transactionIntent);

    expect(decode58Check).toHaveBeenCalledWith("recipient");
    expect(decode58Check).toHaveBeenCalledWith("sender");
    expect(craftStandardTransaction).toHaveBeenCalledWith(mockConfig, {
      tokenAddress: undefined,
      recipientAddress: "recipient",
      senderAddress: "sender",
      amount: new BigNumber(1000),
      isTransferAsset: false,
      memo: undefined,
      expiration: undefined,
    });
    expect(result).toBe("extendedRawDataHex");
  });

  it("should craft a TRC20 transaction", async () => {
    const transactionIntent: TronIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
      data: { type: "tron" },
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const { transaction: result } = await craftTransaction(mockConfig, transactionIntent);

    expect(decode58Check).toHaveBeenCalledWith("recipient");
    expect(decode58Check).toHaveBeenCalledWith("sender");
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      "recipient",
      "sender",
      new BigNumber(1000),
      undefined,
      undefined,
    );
    expect(result).toBe("extendedRawDataHex");
  });

  it("should craft a native TRX transaction when custom fees are 0", async () => {
    const transactionIntent: TronIntent = {
      intentType: "transaction",
      asset: { type: "native" },
      type: "send",
      recipient: "recipient",
      sender: "sender",
      amount: BigInt(1000),
      data: { type: "tron" },
    };

    (decode58Check as jest.Mock).mockImplementation(address => address);
    (craftStandardTransaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    const { transaction: result } = await craftTransaction(mockConfig, transactionIntent, {
      value: 0n,
    });

    expect(craftStandardTransaction).toHaveBeenCalled();
    expect(craftTrc20Transaction).not.toHaveBeenCalled();
    expect(result).toBe("extendedRawDataHex");
  });

  it("should pass a 0 custom fee straight through for a TRC20 transaction", async () => {
    const customFees = 0n;
    const amount = 1000;
    const transactionIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      amount: BigInt(amount),
    } as TronIntent;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(mockConfig, transactionIntent, {
      value: customFees,
      parameters: { fees: customFees },
    });
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      0,
      undefined,
    );
  });

  it("should pass a custom fee below the default straight through for a TRC20 transaction", async () => {
    const customFees: bigint = 99n;
    const amount: number = 1000;
    const transactionIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      amount: BigInt(amount),
    } as TronIntent;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(mockConfig, transactionIntent, {
      value: customFees,
      parameters: { fees: customFees },
    });
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      99,
      undefined,
    );
  });

  it("should pass a custom fee above the default straight through for a TRC20 transaction", async () => {
    const customFees: bigint = 60_000_000n;
    const amount: number = 1000;
    const transactionIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      amount: BigInt(amount),
    } as TronIntent;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(mockConfig, transactionIntent, {
      value: customFees,
      parameters: { fees: customFees },
    });
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      60_000_000,
      undefined,
    );
  });

  it("should leave the fee limit to the network default when no custom fee is provided for a TRC20 transaction", async () => {
    const amount = 1000;
    const transactionIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      amount: BigInt(amount),
    } as TronIntent;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(mockConfig, transactionIntent);
    // `undefined` here, not the default: `craftTrc20Transaction` owns the `?? DEFAULT_TRC20_FEES_LIMIT`
    // fallback, so the default is asserted in the network + integ tests, not mocked away here.
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      undefined,
      undefined,
    );
  });

  it("should ignore an auto-resolved fee with no override marker and default the fee limit for a TRC20 transaction", async () => {
    // LIVE-36865: the generic framework forwards the net display fee as customFees.value on every send,
    // with no override marker. That value collapses to 0 for an energy-covered account, so it must NOT
    // pin the fee_limit to 0 (OUT_OF_ENERGY) — the default ceiling applies instead.
    const amount = 1000;
    const transactionIntent = {
      intentType: "transaction",
      type: "send",
      asset: {
        type: "trc20",
        assetReference: "contractAddress",
      },
      amount: BigInt(amount),
    } as TronIntent;

    (decode58Check as jest.Mock).mockImplementation(_address => undefined);
    (craftTrc20Transaction as jest.Mock).mockResolvedValue({
      raw_data_hex: "extendedRawDataHex",
    });

    await craftTransaction(mockConfig, transactionIntent, { value: 0n });
    expect(craftTrc20Transaction).toHaveBeenCalledWith(
      mockConfig,
      "contractAddress",
      undefined,
      undefined,
      BigNumber(amount),
      undefined,
      undefined,
    );
  });

  it.each([-1n, BigInt(2 * Number.MAX_SAFE_INTEGER)])(
    "should throw an error when user provides fees which exceeds Typescript Number type value limit for crafting a TRC20 transaction",
    async (customFees: bigint) => {
      await expect(
        craftTransaction(
          mockConfig,
          {
            intentType: "transaction",
            type: "send",
            asset: {
              type: "trc20",
              assetReference: "contractAddress",
            },
          } as TronIntent,
          { value: customFees, parameters: { fees: customFees } },
        ),
      ).rejects.toThrow(
        `fees must be between 0 and ${Number.MAX_SAFE_INTEGER} (Typescript Number type value limit)`,
      );
    },
  );

  describe("resource staking", () => {
    const SENDER = "sender";
    const RECIPIENT = "recipient";
    const VOTES = [{ name: "sr", address: "srAddress", voteCount: 3 }];

    const stakingIntent = (
      type: string,
      data: Partial<TronTxData> = {},
      overrides: Partial<TransactionIntent<TronMemo, TronTxData>> = {},
    ): TransactionIntent<TronMemo, TronTxData> =>
      ({
        intentType: "transaction",
        type,
        sender: SENDER,
        recipient: "",
        amount: 0n,
        asset: { type: "native" },
        data: { type: "tron", ...data },
        ...overrides,
      }) as TransactionIntent<TronMemo, TronTxData>;

    beforeEach(() => {
      for (const builder of [
        claimRewardTronTransaction,
        freezeTronTransaction,
        legacyUnfreezeTronTransaction,
        unDelegateResourceTransaction,
        unfreezeTronTransaction,
        voteTronSuperRepresentatives,
        withdrawExpireUnfreezeTronTransaction,
      ]) {
        (builder as jest.Mock).mockResolvedValue({ raw_data_hex: "stakingRawDataHex" });
      }
    });

    it("crafts a freeze from the amount and the TxData resource", async () => {
      const { transaction } = await craftTransaction(
        mockConfig,
        stakingIntent("freeze", { resource: "BANDWIDTH", duration: 3 }, { amount: 5_000_000n }),
      );

      expect(freezeTronTransaction).toHaveBeenCalledWith(
        mockConfig,
        SENDER,
        new BigNumber(5_000_000),
        "BANDWIDTH",
      );
      expect(transaction).toBe("stakingRawDataHex");
    });

    it("crafts an unfreeze from the amount and the TxData resource", async () => {
      await craftTransaction(
        mockConfig,
        stakingIntent("unfreeze", { resource: "ENERGY" }, { amount: 2_000_000n }),
      );

      expect(unfreezeTronTransaction).toHaveBeenCalledWith(
        mockConfig,
        SENDER,
        new BigNumber(2_000_000),
        "ENERGY",
      );
    });

    it("crafts a vote from the TxData vote list", async () => {
      await craftTransaction(mockConfig, stakingIntent("vote", { votes: VOTES }));

      expect(voteTronSuperRepresentatives).toHaveBeenCalledWith(mockConfig, SENDER, VOTES);
    });

    it("crafts a vote with an empty list when the TxData carries none", async () => {
      await craftTransaction(mockConfig, stakingIntent("vote"));

      expect(voteTronSuperRepresentatives).toHaveBeenCalledWith(mockConfig, SENDER, []);
    });

    it("crafts a claimReward from the sender alone", async () => {
      await craftTransaction(mockConfig, stakingIntent("claimReward"));

      expect(claimRewardTronTransaction).toHaveBeenCalledWith(mockConfig, SENDER);
    });

    it("crafts a withdrawExpireUnfreeze from the sender alone", async () => {
      await craftTransaction(mockConfig, stakingIntent("withdrawExpireUnfreeze"));

      expect(withdrawExpireUnfreezeTronTransaction).toHaveBeenCalledWith(mockConfig, SENDER);
    });

    it("crafts an unDelegateResource towards the recipient", async () => {
      await craftTransaction(
        mockConfig,
        stakingIntent(
          "unDelegateResource",
          { resource: "ENERGY" },
          { recipient: RECIPIENT, amount: 1_000_000n },
        ),
      );

      expect(unDelegateResourceTransaction).toHaveBeenCalledWith(mockConfig, {
        ownerAddress: SENDER,
        receiverAddress: RECIPIENT,
        amount: new BigNumber(1_000_000),
        resource: "ENERGY",
      });
    });

    it("crafts a legacyUnfreeze with a receiver when reclaiming a delegation", async () => {
      await craftTransaction(
        mockConfig,
        stakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }, { recipient: RECIPIENT }),
      );

      expect(legacyUnfreezeTronTransaction).toHaveBeenCalledWith(mockConfig, {
        ownerAddress: SENDER,
        resource: "BANDWIDTH",
        receiverAddress: RECIPIENT,
      });
    });

    it("crafts a legacyUnfreeze without a receiver when there is no recipient", async () => {
      await craftTransaction(
        mockConfig,
        stakingIntent("legacyUnfreeze", { resource: "BANDWIDTH" }),
      );

      expect(legacyUnfreezeTronTransaction).toHaveBeenCalledWith(mockConfig, {
        ownerAddress: SENDER,
        resource: "BANDWIDTH",
        receiverAddress: undefined,
      });
    });

    it("rejects an unknown mode rather than signing it as a plain transfer", async () => {
      await expect(craftTransaction(mockConfig, stakingIntent("notAMode"))).rejects.toThrow(
        /unsupported Tron intent type/,
      );
      expect(craftStandardTransaction).not.toHaveBeenCalled();
    });

    it("throws when the node returns no raw_data_hex", async () => {
      (freezeTronTransaction as jest.Mock).mockResolvedValue({});

      await expect(
        craftTransaction(
          mockConfig,
          stakingIntent("freeze", { resource: "BANDWIDTH" }, { amount: 5_000_000n }),
        ),
      ).rejects.toThrow(/no raw_data_hex/);
    });
  });
});
