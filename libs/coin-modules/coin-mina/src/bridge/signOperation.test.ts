import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { BigNumber } from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { reEncodeRawSignature } from "../common-logic";
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
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("./buildTransaction");
jest.mock("../common-logic");

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
  });
});
