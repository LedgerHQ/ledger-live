import { FeeNotLoaded } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import { buildSignOperation } from "./signOperation";
import {
  createFixtureBaseAccount,
  createFixtureTransaction,
  createFixtureSigner,
  createFixtureSignerContext,
  VALID_ADDRESS,
} from "./bridge.fixture";

jest.mock("../common-logic", () => ({
  getNextValidSequence: jest.fn().mockResolvedValue(5),
  estimateFees: jest.fn().mockResolvedValue({ cost: BigInt(1000), energy: BigInt(501) }),
  craftTransaction: jest.fn().mockResolvedValue({
    transaction: {
      sender: Buffer.alloc(32),
      nonce: 5n,
      // Unix timestamp ~2023-11-15
      expiry: 1700000000n,
      energyAmount: 501n,
      transactionType: 3,
      payload: Buffer.alloc(48),
    },
    serializedTransaction: "aabbccdd",
  }),
  combine: jest.fn().mockReturnValue("combined-signature"),
}));

jest.mock("./getTransactionStatus", () => ({
  getTransactionStatus: jest.fn().mockResolvedValue({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(1000),
    amount: new BigNumber(5000000),
    totalSpent: new BigNumber(5001000),
  }),
}));

describe("signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildSignOperation", () => {
    it("should emit device-signature-requested, device-signature-granted, and signed events", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      const eventTypes = events.map(e => e.type);
      expect(eventTypes).toContain("device-signature-requested");
      expect(eventTypes).toContain("device-signature-granted");
      expect(eventTypes).toContain("signed");
    });

    it("should throw FeeNotLoaded when fee is not set", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction({ fee: undefined });

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(FeeNotLoaded);
    });

    it("should call signer.getPublicKey with correct derivation path", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const derivationPath = "m/1105'/0'/1'/2'/3'/4'";
      const account = createFixtureBaseAccount({ freshAddressPath: derivationPath });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(mockSigner.getPublicKey).toHaveBeenCalledWith(derivationPath, false);
    });

    it("should call signer.signTransfer with transaction and path", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const derivationPath = "m/1105'/0'/0'/0'/0'/0'";
      const account = createFixtureBaseAccount({ freshAddressPath: derivationPath });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(mockSigner.signTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: expect.any(Buffer),
          nonce: expect.any(BigInt),
        }),
        derivationPath,
      );
    });

    it("should return signed operation with correct structure", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN
      expect(signedEvent.type).toBe("signed");
      expect(signedEvent.signedOperation).toBeDefined();
      expect(signedEvent.signedOperation.signature).toBe("combined-signature");
      expect(signedEvent.signedOperation.operation).toMatchObject({
        type: "OUT",
        accountId: account.id,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
      });
    });

    it("should set operation value from transaction status amount", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN - amount comes from getTransactionStatus mock (5000000)
      expect(signedEvent.signedOperation.operation.value).toEqual(new BigNumber(5000000));
    });

    it("should set operation fee from estimation", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN - fee comes from estimateFees mock (1000)
      expect(signedEvent.signedOperation.operation.fee).toEqual(new BigNumber(1000));
    });

    it("should use sequence number from last pending operation when available", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount({
        pendingOperations: [{ transactionSequenceNumber: new BigNumber(10) }] as any,
        operations: [{ transactionSequenceNumber: new BigNumber(5) }] as any,
      });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN - should use pending op sequence (10) + 1 = 11
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(11),
      );
    });

    it("should use sequence number from last operation when no pending", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount({
        pendingOperations: [],
        operations: [{ transactionSequenceNumber: new BigNumber(7) }] as any,
      });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN - should use last op sequence (7) + 1 = 8
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(8),
      );
    });

    it("should start sequence at 1 when no operations exist", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount({
        pendingOperations: [],
        operations: [],
      });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN - should use 0 + 1 = 1
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(1),
      );
    });

    it("should propagate signer errors", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      mockSigner.signTransfer = jest.fn().mockRejectedValue(new Error("User rejected"));
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow("User rejected");
    });

    it("should call craftTransaction with correct parameters", async () => {
      // GIVEN
      const { craftTransaction } = jest.requireMock("../common-logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(1000000),
        recipient: VALID_ADDRESS,
      });

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          address: account.freshAddress,
          publicKey: expect.any(String),
          nextSequenceNumber: 5,
        }),
        expect.objectContaining({
          recipient: transaction.recipient,
          amount: expect.any(BigNumber),
          fee: expect.any(BigNumber),
          energy: BigInt(501),
        }),
      );
    });

    it("should call combine with serialized transaction and signature", async () => {
      // GIVEN
      const { combine } = jest.requireMock("../common-logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN - 128 hex chars = 64 bytes, Ed25519 signature
      expect(combine).toHaveBeenCalledWith("aabbccdd", "aa".repeat(64));
    });

    it("should include memo in craftTransaction when present", async () => {
      // GIVEN
      const { craftTransaction } = jest.requireMock("../common-logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction({ memo: "test memo" });

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          memo: "test memo",
        }),
      );
    });

    it("should set operation date to current time", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount();
      const transaction = createFixtureTransaction();
      const beforeTime = new Date();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];
      const afterTime = new Date();

      // THEN
      const operationDate = signedEvent.signedOperation.operation.date;
      expect(operationDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(operationDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should generate correct operation id format", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureBaseAccount({ id: "concordium:test-account" });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      const events = await firstValueFrom(observable.pipe(toArray()));
      const signedEvent = events[2];

      // THEN
      expect(signedEvent.signedOperation.operation.id).toContain("concordium:test-account");
      expect(signedEvent.signedOperation.operation.id).toContain("OUT");
    });
  });
});
