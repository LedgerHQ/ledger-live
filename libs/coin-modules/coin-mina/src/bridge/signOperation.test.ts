import { FeeNotLoaded, UserRefusedOnDevice } from "@ledgerhq/errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { BigNumber } from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { MINA_CANCEL_RETURN_CODE } from "../consts";
import { reEncodeRawSignature } from "../logic/utils";
import {
  createMockAccount,
  createMockTransaction,
  createMockUnsignedTransaction,
  mockDeviceId,
  createMockSignerContext,
} from "../test/fixtures";
import { buildTransaction } from "./buildTransaction";
import { buildSignOperation, buildOptimisticOperation } from "./signOperation";

// Mock dependencies
jest.mock("@ledgerhq/ledger-wallet-framework/operation");
jest.mock("./buildTransaction");
jest.mock("../logic/utils");

describe("signOperation", () => {
  // Mock reset before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
    (encodeOperationId as jest.Mock).mockReturnValue("mock_operation_id");
    (buildTransaction as jest.Mock).mockResolvedValue(mockUnsignedTransaction);
    (reEncodeRawSignature as jest.Mock).mockReturnValue("encoded_signature");
  });

  // Use fixtures instead of defining mock data locally
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction();
  const mockUnsignedTransaction = createMockUnsignedTransaction(mockAccount, mockTransaction);
  const mockSignerContext = createMockSignerContext();

  describe("buildOptimisticOperation", () => {
    it("should build operation with correct values", () => {
      const result = buildOptimisticOperation(mockAccount, mockTransaction, new BigNumber(10));

      expect(result).toEqual({
        id: "mock_operation_id",
        hash: "",
        type: "OUT",
        value: new BigNumber(1010), // amount + fee
        fee: new BigNumber(10),
        blockHash: null,
        blockHeight: null,
        senders: [mockAccount.freshAddress],
        recipients: [mockTransaction.recipient],
        accountId: mockAccount.id,
        date: expect.any(Date),
        transactionSequenceNumber: new BigNumber(1),
        extra: {
          memo: "test memo",
          accountCreationFee: "0",
        },
      });

      expect(encodeOperationId).toHaveBeenCalledWith(mockAccount.id, "", "OUT");
    });

    it("should subtract account creation fee from value when present", () => {
      const txWithCreationFee = createMockTransaction({
        fees: {
          fee: new BigNumber(10),
          accountCreationFee: new BigNumber(5),
        },
      });

      const result = buildOptimisticOperation(mockAccount, txWithCreationFee, new BigNumber(10));

      // Value should be amount + fee - accountCreationFee = 1000 + 10 - 5 = 1005
      expect(result.value).toEqual(new BigNumber(1005));
      expect(result.extra.accountCreationFee).toBe("5");
    });

    it("should build DELEGATE operation when txType is stake", () => {
      const stakeTx = createMockTransaction({ txType: "stake" });

      const result = buildOptimisticOperation(mockAccount, stakeTx, new BigNumber(10));

      expect(result.type).toBe("DELEGATE");
      expect(encodeOperationId).toHaveBeenCalledWith(mockAccount.id, "", "DELEGATE");
    });

    it("should build UNDELEGATE operation when txType is unstake", () => {
      const unstakeTx = createMockTransaction({ txType: "unstake" });

      const result = buildOptimisticOperation(mockAccount, unstakeTx, new BigNumber(10));

      expect(result.type).toBe("UNDELEGATE");
      expect(encodeOperationId).toHaveBeenCalledWith(mockAccount.id, "", "UNDELEGATE");
    });
  });

  describe("buildSignOperation", () => {
    it("should emit correct events and return signed operation", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const events: string[] = [];
      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: mockDeviceId,
      });

      observable.subscribe({
        next: event => {
          events.push(event.type);

          if (event.type === "signed") {
            const { operation, signature } = event.signedOperation;

            // Check operation
            expect(operation).toEqual(
              expect.objectContaining({
                id: "mock_operation_id",
                type: "OUT",
                value: new BigNumber(1010),
                fee: new BigNumber(10),
                senders: [mockAccount.freshAddress],
                recipients: [mockTransaction.recipient],
              }),
            );

            // Check signature
            const parsedSignature = JSON.parse(signature);
            expect(parsedSignature).toEqual({
              transaction: mockUnsignedTransaction,
              signature: "encoded_signature",
            });
          }
        },
        complete: () => {
          // Check all events were emitted in the correct order
          expect(events).toEqual([
            "device-signature-requested",
            "device-signature-granted",
            "signed",
          ]);
          done();
        },
        error: error => done(error),
      });
    });

    it("should build transaction with correct parameters", async () => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: mockDeviceId,
      });

      await firstValueFrom(observable.pipe());

      expect(buildTransaction).toHaveBeenCalledWith(mockAccount, mockTransaction);
    });

    it("should call signer with correct parameters", async () => {
      const mockSignerContextSpy = createMockSignerContext();

      const signOperation = buildSignOperation(mockSignerContextSpy);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: mockDeviceId,
      });

      await firstValueFrom(observable.pipe());

      expect(mockSignerContextSpy).toHaveBeenCalledWith(mockDeviceId, expect.any(Function));
    });

    it("should throw FeeNotLoaded when fees are missing", done => {
      const txWithoutFees = createMockTransaction();
      // @ts-expect-error — testing runtime guard when fees are undefined
      txWithoutFees.fees = undefined;

      const signOperation = buildSignOperation(mockSignerContext);

      signOperation({
        account: mockAccount,
        transaction: txWithoutFees,
        deviceId: mockDeviceId,
      }).subscribe({
        error: error => {
          expect(error).toBeInstanceOf(FeeNotLoaded);
          done();
        },
        complete: () => done(new Error("Expected error")),
      });
    });

    it("should throw UserRefusedOnDevice when user cancels on device", done => {
      const cancelContext = createMockSignerContext({
        returnCode: MINA_CANCEL_RETURN_CODE,
        signature: "",
      });

      const signOperation = buildSignOperation(cancelContext);

      signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: mockDeviceId,
      }).subscribe({
        error: error => {
          expect(error).toBeInstanceOf(UserRefusedOnDevice);
          done();
        },
        complete: () => done(new Error("Expected error")),
      });
    });

    it("should throw when signature is missing and return code is unexpected", done => {
      const errorContext = createMockSignerContext({
        returnCode: "0xFFFF",
        signature: "",
      });

      const signOperation = buildSignOperation(errorContext);

      signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: mockDeviceId,
      }).subscribe({
        error: error => {
          expect(error).not.toBeUndefined();
          expect(String(error)).toContain("0xFFFF");
          done();
        },
        complete: () => done(new Error("Expected error")),
      });
    });
  });
});
