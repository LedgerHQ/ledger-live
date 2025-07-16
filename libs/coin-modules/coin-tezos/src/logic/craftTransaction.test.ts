import { craftTransaction } from "./craftTransaction";
import { getTezosToolkit } from "./tezosToolkit";
import coinConfig from "../config";
import { OpKind } from "@taquito/rpc";
import { DEFAULT_FEE } from "@taquito/taquito";

type TransactionType = "send" | "delegate" | "undelegate";

jest.mock("./tezosToolkit");
jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));

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
    mockTezosToolkit.estimate.reveal.mockResolvedValue({ gasLimit: 100, storageLimit: 0 });
    (coinConfig.getCoinConfig as jest.Mock).mockReturnValue({ fees: { minRevealGasLimit: 100 } });

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
        fee: DEFAULT_FEE.REVEAL.toString(),
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
});
