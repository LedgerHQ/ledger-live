import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import * as buildOptimisticOperationModule from "./buildOptimisticOperation";
import * as buildTransactionModule from "./buildTransaction";
import { buildSignOperation } from "./signOperation";
import type { AlgorandSigner } from "./signer";
import type { AlgorandAccount, AlgorandTransaction, AlgorandOperation } from "./types";

jest.mock("./buildTransaction");
jest.mock("./buildOptimisticOperation");

const mockBuildTransactionPayload =
  buildTransactionModule.buildTransactionPayload as jest.MockedFunction<
    typeof buildTransactionModule.buildTransactionPayload
  >;

const mockEncodeToSign = buildTransactionModule.encodeToSign as jest.MockedFunction<
  typeof buildTransactionModule.encodeToSign
>;

const mockEncodeToBroadcast = buildTransactionModule.encodeToBroadcast as jest.MockedFunction<
  typeof buildTransactionModule.encodeToBroadcast
>;

const mockBuildOptimisticOperation =
  buildOptimisticOperationModule.buildOptimisticOperation as jest.MockedFunction<
    typeof buildOptimisticOperationModule.buildOptimisticOperation
  >;

describe("signOperation", () => {
  const mockAccount: AlgorandAccount = {
    id: "algorand-account-1",
    freshAddress: "ALGO_ADDRESS",
    freshAddressPath: "44'/283'/0'/0/0",
    algorandResources: {
      rewards: new BigNumber("0"),
      nbAssets: 0,
    },
  } as unknown as AlgorandAccount;

  const mockTransaction: AlgorandTransaction = {
    family: "algorand",
    mode: "send",
    amount: new BigNumber("1000000"),
    recipient: "RECIPIENT_ADDRESS",
    fees: new BigNumber("1000"),
  };

  const mockOperation: AlgorandOperation = {
    id: "op-1",
    hash: "",
    type: "OUT",
    value: new BigNumber("1001000"),
    fee: new BigNumber("1000"),
    senders: ["ALGO_ADDRESS"],
    recipients: ["RECIPIENT_ADDRESS"],
    accountId: "algorand-account-1",
    date: new Date(),
    blockHash: null,
    blockHeight: null,
    extra: {},
  };

  const mockSignature = Buffer.from("mock_signature");

  const mockSignerContext: SignerContext<AlgorandSigner> = jest.fn().mockResolvedValue({
    signature: mockSignature,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildTransactionPayload.mockResolvedValue({} as never);
    mockEncodeToSign.mockReturnValue("encoded_tx_hex");
    mockEncodeToBroadcast.mockReturnValue(Buffer.from("broadcast_payload"));
    mockBuildOptimisticOperation.mockReturnValue(mockOperation);
  });

  describe("buildSignOperation", () => {
    it("should return a function that creates an Observable", () => {
      const signOperation = buildSignOperation(mockSignerContext);

      expect(typeof signOperation).toBe("function");

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      expect(observable).not.toBeUndefined();
      expect(typeof observable.subscribe).toBe("function");
    });

    it("should throw FeeNotLoaded when fees are not set", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const transactionWithoutFees: AlgorandTransaction = {
        ...mockTransaction,
        fees: null,
      };

      const observable = signOperation({
        account: mockAccount,
        transaction: transactionWithoutFees,
        deviceId: "device-1",
      });

      observable.subscribe({
        error: err => {
          expect(err).toBeInstanceOf(FeeNotLoaded);
          done();
        },
        complete: () => {
          done.fail("Should have thrown FeeNotLoaded");
        },
      });
    });

    it("should emit device-signature-requested event", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const events: string[] = [];

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        next: event => {
          events.push(event.type);
        },
        complete: () => {
          expect(events).toContain("device-signature-requested");
          done();
        },
        error: done.fail,
      });
    });

    it("should emit device-signature-granted event after signing", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const events: string[] = [];

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        next: event => {
          events.push(event.type);
        },
        complete: () => {
          expect(events).toContain("device-signature-granted");
          done();
        },
        error: done.fail,
      });
    });

    it("should emit signed event with signedOperation", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      let signedEvent: { type: string; signedOperation?: unknown } | undefined;

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        next: event => {
          if (event.type === "signed") {
            signedEvent = event;
          }
        },
        complete: () => {
          expect(signedEvent).not.toBeUndefined();
          expect(signedEvent?.signedOperation).toHaveProperty("operation");
          expect(signedEvent?.signedOperation).toHaveProperty("signature");
          done();
        },
        error: done.fail,
      });
    });

    it("should call signerContext with correct parameters", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-123",
      });

      observable.subscribe({
        complete: () => {
          expect(mockSignerContext).toHaveBeenCalledWith("device-123", expect.any(Function));
          done();
        },
        error: done.fail,
      });
    });

    it("should build transaction payload and encode for signing", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        complete: () => {
          expect(mockBuildTransactionPayload).toHaveBeenCalledWith(mockAccount, mockTransaction);
          expect(mockEncodeToSign).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it("should throw error when signature is missing", done => {
      const signerWithoutSignature: SignerContext<AlgorandSigner> = jest.fn().mockResolvedValue({
        signature: null,
      });

      const signOperation = buildSignOperation(signerWithoutSignature);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        error: err => {
          expect(err.message).toBe("No signature");
          done();
        },
        complete: () => {
          done.fail("Should have thrown error");
        },
      });
    });

    it("should encode for broadcast after signing", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        complete: () => {
          expect(mockEncodeToBroadcast).toHaveBeenCalledWith(expect.anything(), mockSignature);
          done();
        },
        error: done.fail,
      });
    });

    it("should build optimistic operation", done => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      observable.subscribe({
        complete: () => {
          expect(mockBuildOptimisticOperation).toHaveBeenCalledWith(mockAccount, mockTransaction);
          done();
        },
        error: done.fail,
      });
    });

    it("should support cancellation", () => {
      const signOperation = buildSignOperation(mockSignerContext);

      const observable = signOperation({
        account: mockAccount,
        transaction: mockTransaction,
        deviceId: "device-1",
      });

      const subscription = observable.subscribe({
        next: () => {},
      });

      // Should not throw
      expect(() => subscription.unsubscribe()).not.toThrow();
    });
  });
});
