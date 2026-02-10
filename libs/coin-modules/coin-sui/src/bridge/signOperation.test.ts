import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { LedgerSigner } from "@mysten/signers/ledger";
import { getFullnodeUrl } from "@mysten/sui/client";
import { messageWithIntent as mockMessageWithIntent } from "@mysten/sui/cryptography";
import { toSerializedSignature as mockToSerializedSignature } from "@mysten/sui/cryptography";
import { verifyTransactionSignature as mockVerifyTransactionSignature } from "@mysten/sui/verify";
import { BigNumber } from "bignumber.js";
import { take } from "rxjs/operators";
import coinConfig from "../config";
import type { SuiAccount, SuiSigner, Transaction, SuiSignedOperation } from "../types";
import { ensureAddressFormat as mockEnsureAddressFormat } from "../utils";
import { buildOptimisticOperation as mockBuildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction as mockBuildTransaction } from "./buildTransaction";
import buildSignOperation from "./signOperation";
import { calculateAmount as mockCalculateAmount } from "./utils";

// Mock dependencies
jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn(() => ({ node: { url: "http://test.com" } })),
    setCoinConfig: jest.fn(),
  },
}));

jest.mock("./buildOptimisticOperation", () => ({
  buildOptimisticOperation: jest.fn(),
}));

jest.mock("./buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));

jest.mock("./utils", () => ({
  calculateAmount: jest.fn(),
  ensureAddressFormat: jest.fn(),
}));

jest.mock("../utils", () => ({
  ensureAddressFormat: jest.fn(),
}));

jest.mock("@mysten/sui/cryptography", () => ({
  messageWithIntent: jest.fn(),
  toSerializedSignature: jest.fn(),
}));

jest.mock("@mysten/sui/keypairs/ed25519", () => ({
  Ed25519PublicKey: jest.fn(() => ({ equals: jest.fn(() => true) })),
}));

jest.mock("@mysten/sui/verify", () => ({
  verifyTransactionSignature: jest.fn(),
}));

jest.mock("@mysten/signers/ledger", () => ({
  LedgerSigner: {
    fromDerivationPath: jest.fn(),
  },
}));

// Setup LedgerSigner mock
const mockLedgerSigner = {
  signTransaction: jest.fn().mockResolvedValue({ signature: new Uint8Array(64).fill(0x42) }),
};

LedgerSigner.fromDerivationPath.mockResolvedValue(mockLedgerSigner);

beforeAll(() => {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    node: { url: getFullnodeUrl("mainnet") },
  }));
});

describe("buildSignOperation", () => {
  const mockAccount: SuiAccount = {
    id: "test-account-id",
    name: "Test Account",
    address: "0x1234567890abcdef",
    freshAddress: "0x1234567890abcdef",
    freshAddressPath: "m/44'/784'/0'/0'/0'",
    currency: {
      id: "sui",
      name: "Sui",
      family: "sui",
      units: [],
      type: "CryptoCurrency",
    },
    balance: new BigNumber("1000000000"),
    spendableBalance: new BigNumber("1000000000"),
    blockHeight: 1000,
    lastSyncDate: new Date(),
    operations: [],
    pendingOperations: [],
    unit: {
      name: "SUI",
      code: "SUI",
      magnitude: 9,
    },
    type: "Account",
  } as any as SuiAccount;

  const mockTransaction: Transaction = {
    id: "test-transaction-id",
    family: "sui",
    mode: "send",
    coinType: "0x2::sui::SUI",
    amount: new BigNumber("100000000"),
    recipient: "0xabcdef1234567890",
    fees: new BigNumber("1000000"),
    errors: {},
    warnings: {},
    useAllAmount: false,
    estimatedFees: new BigNumber("1000000"),
    feeStrategy: "medium",
    networkInfo: {
      family: "sui",
      fees: new BigNumber("1000000"),
    },
  } as Transaction;

  const mockSuiSigner: SuiSigner = {
    getPublicKey: jest.fn(),
    signTransaction: jest.fn(),
    getVersion: jest.fn(),
    transport: {} as any,
  } as any as SuiSigner;

  const deviceId = "test-device-id";
  const fakePublicKey = new Uint8Array(32).fill(0x01);
  const fakeSignature = new Uint8Array(64).fill(0x42);
  const fakeUnsignedTx = new Uint8Array([1, 2, 3, 4, 5]);
  const fakeSignData = new Uint8Array([5, 4, 3, 2, 1]);
  const fakeSerializedSignature = "serialized-signature";
  const fakeOptimisticOperation = {
    id: "operation-id",
    type: "OUT",
    value: new BigNumber("100000000"),
  };

  let signerContext: SignerContext<SuiSigner>;
  let signOperation: ReturnType<typeof buildSignOperation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockCalculateAmount.mockReturnValue(new BigNumber("100000000"));
    mockBuildTransaction.mockResolvedValue({ unsigned: fakeUnsignedTx });
    mockMessageWithIntent.mockReturnValue(fakeSignData);
    mockToSerializedSignature.mockReturnValue(fakeSerializedSignature);
    mockBuildOptimisticOperation.mockReturnValue(fakeOptimisticOperation);
    mockVerifyTransactionSignature.mockResolvedValue({ equals: () => true });
    mockEnsureAddressFormat.mockReturnValue("0x1234567890abcdef");

    // Setup signer mocks
    (mockSuiSigner.getPublicKey as jest.Mock).mockResolvedValue({
      publicKey: fakePublicKey,
      address: "0x1234567890abcdef",
    });
    (mockSuiSigner.signTransaction as jest.Mock).mockResolvedValue({
      signature: fakeSignature,
    });

    // Patch LedgerSigner mock again in case it is reset
    LedgerSigner.fromDerivationPath.mockResolvedValue(mockLedgerSigner);
    mockLedgerSigner.signTransaction.mockResolvedValue({ signature: fakeSignature });

    // Setup signer context
    signerContext = jest
      .fn()
      .mockImplementation(async (deviceId: string, fn: (signer: SuiSigner) => Promise<any>) => {
        return fn(mockSuiSigner);
      });

    signOperation = buildSignOperation(signerContext);
  });

  describe("Successful signing flow", () => {
    it("should emit events in correct order", done => {
      const events: any[] = [];

      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: event => {
            events.push(event);
            if (events.length === 3) {
              expect(events).toEqual([
                { type: "device-signature-requested" },
                { type: "device-signature-granted" },
                {
                  type: "signed",
                  signedOperation: {
                    operation: fakeOptimisticOperation,
                    signature: new Uint8Array(64).fill(0x42),
                    rawData: { unsigned: new Uint8Array([1, 2, 3, 4, 5]) },
                  },
                },
              ]);
              done();
            }
          },
          error: done,
        });
    });

    it("should call signer context with correct parameters", done => {
      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(signerContext).toHaveBeenCalledTimes(1);
            expect(signerContext).toHaveBeenNthCalledWith(1, deviceId, expect.any(Function));
            done();
          },
          error: done,
        });
    });

    it("should sign transaction with correct parameters", done => {
      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockLedgerSigner.signTransaction).toHaveBeenCalledWith(
              fakeUnsignedTx,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });

    it("should build transaction with calculated amount", done => {
      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockCalculateAmount).toHaveBeenCalledWith({
              account: mockAccount,
              transaction: mockTransaction,
            });
            expect(mockBuildTransaction).toHaveBeenCalledWith(
              mockAccount,
              {
                ...mockTransaction,
                amount: new BigNumber("100000000"),
              },
              true,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });

    it("should build optimistic operation with correct parameters", done => {
      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockBuildOptimisticOperation).toHaveBeenCalledWith(
              mockAccount,
              { ...mockTransaction, amount: new BigNumber("100000000") },
              mockTransaction.fees,
            );
            done();
          },
          error: done,
        });
    });

    it("should return signed operation with correct structure", done => {
      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction })
        .pipe(take(3))
        .subscribe({
          next: event => {
            if (event.type === "signed") {
              const signedOperation = event.signedOperation as SuiSignedOperation;
              expect(signedOperation.operation).toEqual(fakeOptimisticOperation);
              expect(signedOperation.signature).toEqual(fakeSignature);
              expect(signedOperation.rawData.unsigned).toEqual(fakeUnsignedTx);
              done();
            }
          },
          error: done,
        });
    });
  });

  describe("Error handling", () => {
    it("should throw FeeNotLoaded when fees are missing", done => {
      const transactionWithoutFees = { ...mockTransaction, fees: null };

      signOperation({
        account: mockAccount,
        deviceId,
        transaction: transactionWithoutFees,
      }).subscribe({
        error: error => {
          expect(error).toBeInstanceOf(FeeNotLoaded);
          done();
        },
      });
    });

    it("should propagate errors from signTransaction", done => {
      const signError = new Error("Sign transaction error");
      (mockLedgerSigner.signTransaction as jest.Mock).mockRejectedValue(signError);

      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction }).subscribe({
        error: error => {
          expect(error).toBe(signError);
          done();
        },
      });
    });

    it("should propagate errors from buildTransaction", done => {
      const buildError = new Error("Build transaction error");
      mockBuildTransaction.mockRejectedValue(buildError);

      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction }).subscribe({
        error: error => {
          expect(error).toBe(buildError);
          done();
        },
      });
    });

    it("should propagate errors from calculateAmount", done => {
      const calculateError = new Error("Calculate amount error");
      mockCalculateAmount.mockImplementation(() => {
        throw calculateError;
      });

      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction }).subscribe({
        error: error => {
          expect(error).toBe(calculateError);
          done();
        },
      });
    });
  });

  describe("useAllAmount scenarios", () => {
    it("should calculate amount when useAllAmount is true", done => {
      const transactionWithUseAllAmount = { ...mockTransaction, useAllAmount: true };
      mockCalculateAmount.mockReturnValue(new BigNumber("500000000"));

      signOperation({ account: mockAccount, deviceId, transaction: transactionWithUseAllAmount })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockCalculateAmount).toHaveBeenCalledWith({
              account: mockAccount,
              transaction: transactionWithUseAllAmount,
            });
            expect(mockBuildTransaction).toHaveBeenCalledWith(
              mockAccount,
              {
                ...transactionWithUseAllAmount,
                amount: new BigNumber("500000000"),
              },
              true,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });

    it("should use original amount when useAllAmount is false", done => {
      const transactionWithoutUseAllAmount = { ...mockTransaction, useAllAmount: false };

      signOperation({ account: mockAccount, deviceId, transaction: transactionWithoutUseAllAmount })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockBuildTransaction).toHaveBeenCalledWith(
              mockAccount,
              {
                ...transactionWithoutUseAllAmount,
                amount: new BigNumber("100000000"),
              },
              true,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });
  });

  describe("Edge cases", () => {
    it("should handle zero fees", done => {
      const transactionWithZeroFees = { ...mockTransaction, fees: new BigNumber("0") };

      signOperation({ account: mockAccount, deviceId, transaction: transactionWithZeroFees })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockBuildOptimisticOperation).toHaveBeenCalledWith(
              mockAccount,
              { ...transactionWithZeroFees, amount: new BigNumber("100000000") },
              new BigNumber("0"),
            );
            done();
          },
          error: done,
        });
    });

    it("should handle null fees", done => {
      const transactionWithNullFees = { ...mockTransaction, fees: null };

      signOperation({
        account: mockAccount,
        deviceId,
        transaction: transactionWithNullFees,
      }).subscribe({
        error: error => {
          expect(error).toBeInstanceOf(FeeNotLoaded);
          done();
        },
      });
    });

    it("should handle very large amounts", done => {
      const largeAmount = new BigNumber(
        "9999999999999999999999999999999999999999999999999999999999999999",
      );
      const transactionWithLargeAmount = { ...mockTransaction, amount: largeAmount };
      mockCalculateAmount.mockReturnValue(largeAmount);

      signOperation({ account: mockAccount, deviceId, transaction: transactionWithLargeAmount })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockBuildTransaction).toHaveBeenCalledWith(
              mockAccount,
              {
                ...transactionWithLargeAmount,
                amount: largeAmount,
              },
              true,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });

    it("should handle zero amount", done => {
      const transactionWithZeroAmount = { ...mockTransaction, amount: new BigNumber("0") };
      mockCalculateAmount.mockReturnValue(new BigNumber("0"));

      signOperation({ account: mockAccount, deviceId, transaction: transactionWithZeroAmount })
        .pipe(take(3))
        .subscribe({
          next: () => {},
          complete: () => {
            expect(mockBuildTransaction).toHaveBeenCalledWith(
              mockAccount,
              {
                ...transactionWithZeroAmount,
                amount: new BigNumber("0"),
              },
              true,
              undefined,
              undefined,
            );
            done();
          },
          error: done,
        });
    });
  });

  describe("Observable behavior", () => {
    it("should complete after successful signing", done => {
      let eventCount = 0;

      signOperation({ account: mockAccount, deviceId, transaction: mockTransaction }).subscribe({
        next: () => {
          eventCount++;
        },
        complete: () => {
          expect(eventCount).toBe(3);
          done();
        },
        error: done,
      });
    });

    it("should handle multiple subscribers", done => {
      let subscriber1Events = 0;
      let subscriber2Events = 0;
      let doneCalled = false;

      const observable = signOperation({
        account: mockAccount,
        deviceId,
        transaction: mockTransaction,
      });

      observable.subscribe({
        next: () => subscriber1Events++,
        complete: () => {
          if (subscriber1Events === 3 && subscriber2Events === 3 && !doneCalled) {
            doneCalled = true;
            done();
          }
        },
        error: done,
      });

      observable.subscribe({
        next: () => subscriber2Events++,
        complete: () => {
          if (subscriber1Events === 3 && subscriber2Events === 3 && !doneCalled) {
            doneCalled = true;
            done();
          }
        },
        error: done,
      });
    });
  });
});
