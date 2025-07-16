import { buildSignOperation } from "./signOperation";
import { buildOptimisticOperation } from "./buildOptimisticOperatioin";
import { VechainSDKTransaction, VechainSigner, Transaction } from "../types";
import { Account, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import BigNumber from "bignumber.js";

// Mock dependencies
jest.mock("./buildOptimisticOperatioin");
jest.mock("../types", () => ({
  ...jest.requireActual("../types"),
  VechainSDKTransaction: {
    of: jest.fn(),
  },
}));

const mockedBuildOptimisticOperation = jest.mocked(buildOptimisticOperation);
const mockedVechainSDKTransaction = jest.mocked(VechainSDKTransaction);

describe("buildSignOperation", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"),
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {} as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  const mockTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"),
    estimatedFees: "210000000000000000",
    body: {
      chainTag: 74,
      blockRef: "0x00000000000b2bce",
      expiration: 18,
      clauses: [
        {
          to: "0x456789012345678901234567890123456789abcd",
          value: "1000000000000000000",
          data: "0x",
        },
      ],
      maxFeePerGas: 10000000000000,
      maxPriorityFeePerGas: 1000000000000,
      gas: 21000,
      dependsOn: null,
      nonce: "0x12345678",
    },
  } as Transaction;

  const mockDeviceId: DeviceId = "mock-device-id";

  const mockSigner: VechainSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };

  const mockSignerContext: SignerContext<VechainSigner> = jest.fn();

  const mockUnsignedTransaction = {
    encoded: Buffer.from("mockencoded", "hex"),
  };

  const mockOperation = {
    id: "vechain:1:0x123:0xtxhash:OUT",
    hash: "",
    type: "OUT" as const,
    value: new BigNumber("1000000000000000000"),
    fee: new BigNumber("210000000000000000"),
    blockHash: null,
    blockHeight: null,
    senders: ["0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4"],
    recipients: ["0x456789012345678901234567890123456789abcd"],
    accountId: "vechain:1:0x123:",
    date: new Date("2022-01-01"),
    extra: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedVechainSDKTransaction.of.mockReturnValue(mockUnsignedTransaction as any);
    mockedBuildOptimisticOperation.mockResolvedValue(mockOperation);
    (mockSigner.signTransaction as jest.Mock).mockResolvedValue(Buffer.from("signature123", "hex"));
    (mockSignerContext as jest.Mock).mockImplementation((deviceId, callback) =>
      callback(mockSigner),
    );
  });

  it("should emit correct sequence of events for successful signing", async () => {
    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    const events: SignOperationEvent[] = [];
    const promise = new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: event => events.push(event),
        complete: resolve,
        error: reject,
      });
    });

    await promise;

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "device-signature-requested" });
    expect(events[1]).toEqual({ type: "device-signature-granted" });
    expect(events[2]).toEqual({
      type: "signed",
      signedOperation: {
        operation: mockOperation,
        signature: "",
        rawData: mockTransaction,
      },
    });
  });

  it("should create unsigned transaction from transaction body", async () => {
    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ complete: resolve, error: reject });
    });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(mockTransaction.body);
  });

  it("should call signer with correct parameters", async () => {
    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ complete: resolve, error: reject });
    });

    expect(mockSignerContext).toHaveBeenCalledWith(mockDeviceId, expect.any(Function));
    expect(mockSigner.signTransaction).toHaveBeenCalledWith(
      mockAccount.freshAddressPath,
      mockUnsignedTransaction.encoded.toString("hex"),
    );
  });

  it("should build optimistic operation with correct parameters", async () => {
    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ complete: resolve, error: reject });
    });

    expect(mockedBuildOptimisticOperation).toHaveBeenCalledWith(mockAccount, mockTransaction);
  });

  it("should convert signature buffer to hex string", async () => {
    const signatureBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    (mockSigner.signTransaction as jest.Mock).mockResolvedValue(signatureBuffer);

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    const events: SignOperationEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: event => events.push(event),
        complete: resolve,
        error: reject,
      });
    });

    const signedEvent = events.find(e => e.type === "signed") as any;
    expect(signedEvent.signedOperation.signature).toBe("12345678");
  });

  it("should handle signer errors", async () => {
    const signerError = new Error("Hardware wallet error");
    (mockSigner.signTransaction as jest.Mock).mockRejectedValue(signerError);

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        observable.subscribe({ complete: resolve, error: reject });
      }),
    ).rejects.toThrow("Hardware wallet error");
  });

  it("should handle VechainSDKTransaction creation errors", async () => {
    const transactionError = new Error("Invalid transaction format");
    mockedVechainSDKTransaction.of.mockImplementation(() => {
      throw transactionError;
    });

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        observable.subscribe({ complete: resolve, error: reject });
      }),
    ).rejects.toThrow("Invalid transaction format");
  });

  it("should handle buildOptimisticOperation errors", async () => {
    const operationError = new Error("Failed to build operation");
    mockedBuildOptimisticOperation.mockRejectedValue(operationError);

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        observable.subscribe({ complete: resolve, error: reject });
      }),
    ).rejects.toThrow("Failed to build operation");
  });

  it("should handle signerContext errors", async () => {
    const contextError = new Error("Signer context failed");
    (mockSignerContext as jest.Mock).mockRejectedValue(contextError);

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        observable.subscribe({ complete: resolve, error: reject });
      }),
    ).rejects.toThrow("Signer context failed");
  });

  it("should work with different device IDs", async () => {
    const deviceIds = ["device1", "device2", "device3"];

    for (const deviceId of deviceIds) {
      const signOperation = buildSignOperation(mockSignerContext);
      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId,
      });

      await new Promise<void>((resolve, reject) => {
        observable.subscribe({ complete: resolve, error: reject });
      });

      expect(mockSignerContext).toHaveBeenCalledWith(deviceId, expect.any(Function));
    }
  });

  it("should include rawData as transaction in signed operation", async () => {
    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: mockDeviceId,
    });

    const events: SignOperationEvent[] = [];
    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: event => events.push(event),
        complete: resolve,
        error: reject,
      });
    });

    const signedEvent = events.find(e => e.type === "signed") as any;
    expect(signedEvent.signedOperation.rawData).toBe(mockTransaction);
  });

  it("should handle different transaction types", async () => {
    const tokenTransaction: Transaction = {
      ...mockTransaction,
      subAccountId: "vechain:1:0x123:+vtho",
      body: {
        ...mockTransaction.body,
        clauses: [
          {
            to: "0x0000000000000000000000000000456e65726779",
            value: "0",
            data: "0xa9059cbb000000000000000000000000456789012345678901234567890123456789abcd0000000000000000000000000000000000000000000000000de0b6b3a7640000",
          },
        ],
      },
    };

    const signOperation = buildSignOperation(mockSignerContext);
    const observable = signOperation({
      account: mockAccount,
      transaction: tokenTransaction,
      deviceId: mockDeviceId,
    });

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({ complete: resolve, error: reject });
    });

    expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(tokenTransaction.body);
  });
});
