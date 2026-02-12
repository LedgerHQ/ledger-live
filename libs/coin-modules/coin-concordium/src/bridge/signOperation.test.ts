import { FeeNotLoaded } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";
import {
  createFixtureAccount,
  createFixtureTransaction,
  createFixtureOperation,
  VALID_ADDRESS,
} from "../test/fixtures";
import { buildSignOperation } from "./signOperation";
import { createFixtureSigner, createFixtureSignerContext } from "./bridge.fixture";

jest.mock("../logic", () => {
  return {
    getNextValidSequence: jest.fn().mockResolvedValue(5),
    estimateFees: jest.fn().mockResolvedValue({ cost: BigInt(1000), energy: BigInt(501) }),
    craftTransaction: jest.fn().mockResolvedValue({
      type: 3, // Transfer
      header: {
        sender: AccountAddress.fromBuffer(Buffer.alloc(32)),
        nonce: 5n,
        expiry: 1700000000n,
        energyAmount: 501n,
      },
      payload: {
        toAddress: AccountAddress.fromBuffer(Buffer.alloc(32)),
        amount: 5000000n,
      },
    }),
    combine: jest.fn().mockReturnValue("combined-signature"),
  };
});

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
      const account = createFixtureAccount();
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
      const account = createFixtureAccount();
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
      const account = createFixtureAccount({ freshAddressPath: derivationPath });
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

    it("should call signer.signTransaction with transaction and path", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const derivationPath = "m/1105'/0'/0'/0'/0'/0'";
      const account = createFixtureAccount({ freshAddressPath: derivationPath });
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(mockSigner.signTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(Number),
          header: expect.objectContaining({
            nonce: expect.any(BigInt),
          }),
          payload: expect.any(Object),
        }),
        derivationPath,
      );
    });

    it("should return signed operation with correct structure", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount();
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
      expect(signedEvent.signedOperation).not.toBeUndefined();
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
      const account = createFixtureAccount();
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
      const account = createFixtureAccount();
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

    it("should use sequence number from API nonce", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount({
        pendingOperations: [
          createFixtureOperation({ transactionSequenceNumber: new BigNumber(10) }),
        ],
        operations: [createFixtureOperation({ transactionSequenceNumber: new BigNumber(5) })],
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

      // THEN - should use API nonce (5), not local calculation
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(5),
      );
    });

    it("should use API nonce regardless of local operations", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount({
        pendingOperations: [],
        operations: [createFixtureOperation({ transactionSequenceNumber: new BigNumber(7) })],
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

      // THEN - should use API nonce (5), not local calculation (7 + 1)
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(5),
      );
    });

    it("should use API nonce even with empty operations", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount({
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

      // THEN - should use API nonce (5), not local calculation (0 + 1)
      expect(signedEvent.signedOperation.operation.transactionSequenceNumber).toEqual(
        new BigNumber(5),
      );
    });

    it("should propagate signer errors", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      mockSigner.signTransaction = jest.fn().mockRejectedValue(new Error("User rejected"));
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount();
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
      const { craftTransaction } = jest.requireMock("../logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount();
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
      const { combine } = jest.requireMock("../logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction();

      // WHEN
      const observable = signOperation({
        account,
        deviceId: "test-device",
        transaction,
      });
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(combine).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]+$/), // serialized hex
        expect.stringMatching(/^[a-f0-9]{128}$/), // 64-byte signature as hex
      );
    });

    it("should include memo in craftTransaction when present", async () => {
      // GIVEN
      const { craftTransaction } = jest.requireMock("../logic");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);
      const account = createFixtureAccount();
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
      const account = createFixtureAccount();
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
      const account = createFixtureAccount({ id: "concordium:test-account" });
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
