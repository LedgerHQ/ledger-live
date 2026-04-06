import { OpKind } from "@taquito/rpc";
import { getRevealFee } from "@taquito/taquito";
import coinConfig from "../config";
import { craftTransaction, rawEncode } from "./craftTransaction";
import { getTezosToolkit } from "./tezosToolkit";

type TransactionType = "send" | "delegate" | "undelegate" | "send_token";

jest.mock("./tezosToolkit");
jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));

function setupFa2ContractMock(parameter: { entrypoint: string; value: unknown }) {
  const toTransferParams = jest.fn().mockReturnValue({
    parameter,
    amount: 0,
    mutez: true,
  });
  const transfer = jest.fn().mockReturnValue({ toTransferParams });
  return { transfer, toTransferParams };
}

describe("craftTransaction", () => {
  const mockTezosToolkit = {
    rpc: {
      getContract: jest.fn(),
      getBlock: jest.fn(),
      forgeOperations: jest.fn(),
    },
    estimate: {
      reveal: jest.fn(),
    },
    contract: {
      at: jest.fn(),
    },
    setProvider: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getTezosToolkit as jest.Mock).mockReturnValue(mockTezosToolkit);
  });

  it("should craft a send transaction", async () => {
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });

    const account = { address: "tz1..." };
    const transaction = {
      type: "send" as TransactionType,
      recipient: "tz2...",
      amount: BigInt(1000),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
    };

    const result = await craftTransaction(account, transaction);

    expect(result.type).toBe("OUT");
    expect(result.contents).toEqual([
      {
        kind: OpKind.TRANSACTION,
        amount: "1000",
        destination: transaction.recipient,
        source: account.address,
        counter: "2",
        fee: "100",
        gas_limit: "200",
        storage_limit: "300",
      },
    ]);
  });

  it("should craft a delegate transaction", async () => {
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });

    const account = { address: "tz1..." };
    const transaction = {
      type: "delegate" as TransactionType,
      recipient: "tz2...",
      amount: BigInt(0),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
    };

    const result = await craftTransaction(account, transaction);

    expect(result.type).toBe("DELEGATE");
    expect(result.contents).toEqual([
      {
        kind: OpKind.DELEGATION,
        source: account.address,
        counter: "2",
        delegate: transaction.recipient,
        fee: "100",
        gas_limit: "200",
        storage_limit: "300",
      },
    ]);
  });

  it("should craft an undelegate transaction", async () => {
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });

    const account = { address: "tz1..." };
    const transaction = {
      type: "undelegate" as TransactionType,
      recipient: "",
      amount: BigInt(0),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
    };

    const result = await craftTransaction(account, transaction);

    expect(result.type).toBe("UNDELEGATE");
    expect(result.contents).toEqual([
      {
        kind: OpKind.DELEGATION,
        source: account.address,
        counter: "2",
        fee: "100",
        gas_limit: "200",
        storage_limit: "300",
      },
    ]);
  });

  it("should craft a transaction with reveal operation", async () => {
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });
    mockTezosToolkit.estimate.reveal.mockResolvedValue({
      gasLimit: 100,
      storageLimit: 0,
      suggestedFeeMutez: getRevealFee("tz1..."),
    });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: {
        minRevealGasLimit: 100,
        minFees: 0,
        minStorageLimit: 0,
      },
    });

    const account = { address: "tz1..." };
    const transaction = {
      type: "send" as TransactionType,
      recipient: "tz2...",
      amount: BigInt(1000),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
    };
    const publicKey = { publicKey: "publicKey", publicKeyHash: "publicKeyHash" };

    const result = await craftTransaction(account, transaction, publicKey);

    expect(result.contents).toEqual([
      {
        kind: OpKind.REVEAL,
        fee: getRevealFee(account.address).toString(),
        gas_limit: "100",
        storage_limit: "0",
        source: publicKey.publicKeyHash,
        counter: "2",
        public_key: publicKey.publicKey,
      },
      {
        kind: OpKind.TRANSACTION,
        amount: "1000",
        destination: transaction.recipient,
        source: account.address,
        counter: "3",
        fee: "100",
        gas_limit: "200",
        storage_limit: "300",
      },
    ]);
  });

  describe("when suggested fee is above or below minFees floor", () => {
    it("craft transaction when default estimation is greater than minFees", async () => {
      mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });
      const suggestedRevealFee = 800;
      mockTezosToolkit.estimate.reveal.mockResolvedValue({
        gasLimit: 300,
        storageLimit: 0,
        suggestedFeeMutez: suggestedRevealFee,
      });
      const minFees = 500;
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: {
          minRevealGasLimit: 300,
          minFees,
          minStorageLimit: 0,
        },
      });

      const account = { address: "tz2..." };
      const mainOpFee = 600;
      const transaction = {
        type: "delegate" as TransactionType,
        recipient: "tz3...",
        amount: BigInt(0),
        fee: { fees: String(mainOpFee), gasLimit: "10000", storageLimit: "0" },
      };
      const publicKey = { publicKey: "pk", publicKeyHash: "pkh" };

      const result = await craftTransaction(account, transaction, publicKey);

      const revealOp = result.contents[0];
      expect(revealOp.kind).toBe(OpKind.REVEAL);
      expect(Number(revealOp.fee ?? 0)).toBe(suggestedRevealFee);
      const delegationOp = result.contents[1];
      expect(Number(delegationOp.fee ?? 0)).toBe(mainOpFee);
    });

    it("craft transaction when default estimation is lesser than minFees", async () => {
      mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });
      mockTezosToolkit.estimate.reveal.mockResolvedValue({
        gasLimit: 50,
        storageLimit: 0,
        suggestedFeeMutez: 100,
      });
      const minFees = 500;
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: {
          minRevealGasLimit: 300,
          minFees,
          minStorageLimit: 25,
        },
      });

      const account = { address: "tz2..." };
      const transaction = {
        type: "delegate" as TransactionType,
        recipient: "tz3...",
        amount: BigInt(0),
        fee: { fees: "200", gasLimit: "1000", storageLimit: "0" },
      };
      const publicKey = { publicKey: "pk", publicKeyHash: "pkh" };

      const result = await craftTransaction(account, transaction, publicKey);

      const revealOp = result.contents[0];
      expect(revealOp.kind).toBe(OpKind.REVEAL);
      expect(revealOp.fee).toBe(String(minFees));
      expect(revealOp.gas_limit).toBe("300");
      expect(revealOp.storage_limit).toBe("25");
    });

    it("craft transaction with customFee splits total so reveal and main op respect minFees", async () => {
      mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });
      mockTezosToolkit.estimate.reveal.mockResolvedValue({
        gasLimit: 300,
        storageLimit: 0,
        suggestedFeeMutez: 100,
      });
      const minFees = 1000;
      (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
        fees: {
          minRevealGasLimit: 300,
          minFees,
          minStorageLimit: 0,
        },
      });

      const account = { address: "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V" };
      const mainOpFee = 1000;
      const transaction = {
        type: "delegate" as TransactionType,
        recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
        amount: BigInt(0),
        fee: { fees: String(mainOpFee), gasLimit: "10000", storageLimit: "0" },
      };
      const publicKey = { publicKey: "pk", publicKeyHash: account.address };

      const result = await craftTransaction(account, transaction, publicKey);

      expect(result.contents).toHaveLength(2);
      const revealFee = Number(result.contents[0].fee ?? 0);
      const delegationFee = Number(result.contents[1].fee ?? 0);
      const total = revealFee + delegationFee;
      expect(revealFee).toBe(minFees);
      expect(delegationFee).toBe(mainOpFee);
      expect(total).toBe(minFees + mainOpFee);
    });
  });

  it("should craft an FA2 send_token transaction", async () => {
    const fa2Param = { entrypoint: "transfer", value: { prim: "Pair" as const } };
    const { transfer } = setupFa2ContractMock(fa2Param);
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });

    const contractAddress = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
    const account = { address: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr" };
    const transaction = {
      type: "send_token" as TransactionType,
      recipient: "tz1VSUr8wwNhLAzempoch5d6nLRSNtxK8LBr",
      amount: BigInt(5),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
      contractAddress,
      tokenId: 0,
    };

    const result = await craftTransaction(account, transaction);

    expect(result.type).toBe("OUT");
    expect(mockTezosToolkit.contract.at).toHaveBeenCalledWith(contractAddress);
    expect(transfer).toHaveBeenCalledWith([
      {
        from_: account.address,
        txs: [{ to_: transaction.recipient, token_id: 0, amount: 5 }],
      },
    ]);
    expect(result.contents).toEqual([
      {
        kind: OpKind.TRANSACTION,
        source: account.address,
        destination: contractAddress,
        amount: "0",
        counter: "2",
        fee: "100",
        gas_limit: "200",
        storage_limit: "300",
        parameters: fa2Param,
      },
    ]);
  });

  it("should craft FA2 send_token with reveal when publicKey is provided", async () => {
    const fa2Param = { entrypoint: "transfer", value: [] };
    const { transfer } = setupFa2ContractMock(fa2Param);
    mockTezosToolkit.contract.at.mockResolvedValue({ methods: { transfer } });
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });
    mockTezosToolkit.estimate.reveal.mockResolvedValue({
      gasLimit: 100,
      storageLimit: 0,
      suggestedFeeMutez: getRevealFee("tz1..."),
    });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({
      fees: {
        minRevealGasLimit: 100,
        minFees: 0,
        minStorageLimit: 0,
      },
    });

    const contractAddress = "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU";
    const account = { address: "tz1..." };
    const transaction = {
      type: "send_token" as TransactionType,
      recipient: "tz2...",
      amount: BigInt(1),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
      contractAddress,
      tokenId: 7,
    };
    const publicKey = { publicKey: "publicKey", publicKeyHash: "publicKeyHash" };

    const result = await craftTransaction(account, transaction, publicKey);

    expect(result.contents).toHaveLength(2);
    expect(result.contents[0].kind).toBe(OpKind.REVEAL);
    expect(result.contents[1]).toMatchObject({
      kind: OpKind.TRANSACTION,
      destination: contractAddress,
      amount: "0",
      counter: "3",
      parameters: fa2Param,
    });
  });

  it("should throw when send_token is missing contractAddress or tokenId", async () => {
    mockTezosToolkit.rpc.getContract.mockResolvedValue({ counter: "1" });

    await expect(
      craftTransaction(
        { address: "tz1..." },
        {
          type: "send_token" as TransactionType,
          recipient: "tz2...",
          amount: 1n,
          fee: {},
        },
      ),
    ).rejects.toThrow("FA2 transfer requires contractAddress and tokenId");

    await expect(
      craftTransaction(
        { address: "tz1..." },
        {
          type: "send_token" as TransactionType,
          recipient: "tz2...",
          amount: 1n,
          fee: {},
          contractAddress: "KT1CpeSQKdkhWi4pinYcseCFKmDhs5M74BkU",
        },
      ),
    ).rejects.toThrow("FA2 transfer requires contractAddress and tokenId");
  });

  it("should throw an error for unsupported transaction type", async () => {
    const account = { address: "tz1..." };
    const transaction = {
      type: "invalid" as any,
      recipient: "tz2...",
      amount: BigInt(1000),
      fee: { fees: "100", gasLimit: "200", storageLimit: "300" },
    };

    await expect(craftTransaction(account, transaction)).rejects.toThrow("unsupported mode");
  });

  it("should include leading watermark byte when using rawEncode", async () => {
    mockTezosToolkit.rpc.getBlock.mockResolvedValue({ hash: "aaaa" });
    mockTezosToolkit.rpc.forgeOperations.mockResolvedValue("deadcafe");

    const rawTx = await rawEncode([]);

    // 0x03 is a conventional prefix (aka a watermark) for tezos transactions
    expect(rawTx).toEqual("03deadcafe");
  });
});
