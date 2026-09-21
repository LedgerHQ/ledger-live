import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Operation } from "@ledgerhq/types-live";
import {
  ConcordiumInvalidPltPayloadError,
  ConcordiumTokenAccountUnavailable,
} from "../types/errors";
import BigNumber from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import { AccountAddress } from "@ledgerhq/concordium-core";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
  createFixtureTransaction,
  createFixtureOperation,
  setupTestnetCoinConfig,
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
    craftPltTransaction: jest.fn().mockReturnValue({
      type: 27, // TokenUpdate
      header: {
        sender: AccountAddress.fromBuffer(Buffer.alloc(32)),
        nonce: 5n,
        expiry: 1700003600n,
        energyAmount: 1080n,
      },
      payload: {
        tokenId: Buffer.from("t-USDT", "utf-8"),
        operations: Buffer.from("81", "hex"),
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

const sign = async (
  transaction: ReturnType<typeof createFixtureTransaction>,
  account: ReturnType<typeof createFixtureAccount> = createFixtureAccount(),
) => {
  const mockSigner = createFixtureSigner();
  const signOperation = buildSignOperation(createFixtureSignerContext(mockSigner));
  const events = await firstValueFrom(
    signOperation({ account, deviceId: "device-1", transaction }).pipe(toArray()),
  );
  return { mockSigner, events };
};

/** A parent carrying its PLT sub-account, which is what marks a transfer as a token send. */
const withTokenSubAccount = () => {
  const parent = createFixtureAccount();
  const subAccount = createFixtureTokenAccount({ parentId: parent.id });
  return { account: { ...parent, subAccounts: [subAccount] }, subAccount };
};

describe("signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTestnetCoinConfig();
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
      const derivationPath = "44'/1'/0'/0'/0'/5'";
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
      const derivationPath = "44'/1'/0'/0'/0'/0'";
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
        expect.any(BigInt),
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
      const signedEvent = events[2] as any;

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

    it("should set operation value from the transaction amount", async () => {
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
      const signedEvent = events[2] as any;

      // THEN
      expect(signedEvent.signedOperation.operation.value).toEqual(transaction.amount);
    });

    // Status resolves the recipient against the token's allow/deny lists, and
    // signing does not read `errors`. Routing through it would put a request in
    // front of the device prompt whose verdict is then discarded — and the
    // recipient cache expires well within the time it takes to plug in and
    // unlock a device, so it would usually be a live request.
    it("does not fetch a transaction status while signing", async () => {
      const { getTransactionStatus } = jest.requireMock("./getTransactionStatus");
      const mockSigner = createFixtureSigner();
      const signOperation = buildSignOperation(createFixtureSignerContext(mockSigner));

      await firstValueFrom(
        signOperation({
          account: createFixtureAccount(),
          deviceId: "test-device",
          transaction: createFixtureTransaction(),
        }).pipe(toArray()),
      );

      expect(getTransactionStatus).not.toHaveBeenCalled();
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
      const signedEvent = events[2] as any;

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
      const signedEvent = events[2] as any;

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
      const signedEvent = events[2] as any;

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
      const signedEvent = events[2] as any;

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
        [expect.stringMatching(/^[a-f0-9]{128}$/)], // 64-byte signature as hex
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
      const signedEvent = events[2] as any;
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
      const signedEvent = events[2] as any;

      // THEN
      expect(signedEvent.signedOperation.operation.id).toContain("concordium:test-account");
      expect(signedEvent.signedOperation.operation.id).toContain("OUT");
    });
  });

  describe("the persisted estimate", () => {
    const { craftPltTransaction, craftTransaction, estimateFees } = jest.requireMock("../logic");

    const tokenTransaction = (over = {}) => {
      const { account, subAccount } = withTokenSubAccount();
      const transaction = createFixtureTransaction({
        subAccountId: subAccount.id,
        fee: new BigNumber(3600),
        energy: 1080,
        ...over,
      });
      return { account, transaction };
    };

    // A second estimate would put a different number on the device's "Max fees"
    // step from the one the wallet showed.
    it("does not re-estimate when preparation persisted the energy", async () => {
      const { account, transaction } = tokenTransaction();

      await sign(transaction, account);

      expect(estimateFees).not.toHaveBeenCalled();
    });

    // Crafting natively would move CCD at the token's integer amount — the wrong
    // asset, at a magnitude the token's decimals chose.
    it("crafts a PLT transfer, never a native one", async () => {
      const { account, transaction } = tokenTransaction();

      await sign(transaction, account);

      expect(craftPltTransaction).toHaveBeenCalled();
      expect(craftTransaction).not.toHaveBeenCalled();
    });

    it("signs with the persisted fee and energy, and the token's own id and decimals", async () => {
      const { account, transaction } = tokenTransaction();

      const { mockSigner } = await sign(transaction, account);

      expect(craftPltTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ address: account.freshAddress, nextSequenceNumber: 5 }),
        expect.objectContaining({
          tokenId: account.subAccounts[0].token.contractAddress,
          decimals: account.subAccounts[0].token.units[0].magnitude,
          energy: BigInt(1080),
        }),
      );
      // The max fee reaching the device is the persisted µCCD cost, not a
      // re-estimate: it is the figure already shown to the user.
      expect(mockSigner.signTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ type: 27 }),
        account.freshAddressPath,
        BigInt(3600),
      );
    });

    // Two balances move, so the send emits two operations: sync builds the
    // confirmed pair the same way, and a mismatch would double-count the fee.
    it("reports the fee on the parent and the token on the sub-account", async () => {
      const { account, transaction } = tokenTransaction();

      const { events } = await sign(transaction, account);
      const { operation } = (
        events[events.length - 1] as { signedOperation: { operation: Operation } }
      ).signedOperation;

      expect(operation).toMatchObject({
        accountId: account.id,
        type: "FEES",
        value: new BigNumber(3600),
        fee: new BigNumber(3600),
      });
      expect(operation.subOperations).toHaveLength(1);
      expect(operation.subOperations?.[0]).toMatchObject({
        accountId: account.subAccounts[0].id,
        type: "OUT",
        value: transaction.amount,
      });
    });

    it("leaves a native transfer reporting a single OUT operation", async () => {
      const { events } = await sign(createFixtureTransaction({ fee: new BigNumber(1000) }));
      const { operation } = (
        events[events.length - 1] as { signedOperation: { operation: Operation } }
      ).signedOperation;

      expect(operation.type).toBe("OUT");
      expect(operation.subOperations).toBeUndefined();
    });

    // Status blocks this, but signing does not read `status.errors`.
    it("refuses a token whose CAL magnitude is missing", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const strippedToken = { ...subAccount.token, units: [] };
      const accountWithoutMagnitude = {
        ...account,
        subAccounts: [{ ...subAccount, token: strippedToken }],
      };
      const transaction = createFixtureTransaction({
        subAccountId: subAccount.id,
        fee: new BigNumber(3600),
        energy: 1080,
      });

      await expect(sign(transaction, accountWithoutMagnitude)).rejects.toBeInstanceOf(
        ConcordiumInvalidPltPayloadError,
      );
      expect(craftPltTransaction).not.toHaveBeenCalled();
    });

    it("keeps estimating for a native transfer", async () => {
      await sign(createFixtureTransaction({ fee: new BigNumber(1000) }));

      expect(estimateFees).toHaveBeenCalled();
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ energy: BigInt(501) }),
      );
    });

    // A draft that was a token transfer can arrive native with the token's
    // energy still attached, via a raw round-trip or an account change.
    it("ignores a stale energy on a native transfer", async () => {
      await sign(createFixtureTransaction({ fee: new BigNumber(1000), energy: 1080 }));

      expect(estimateFees).toHaveBeenCalled();
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ energy: BigInt(501) }),
      );
    });

    // The second assertion is the point: nothing reaches the crafting step.
    it("refuses a subAccountId that no longer resolves", async () => {
      const transaction = createFixtureTransaction({
        subAccountId: "js:2:concordium_testnet:gone:+plt",
        fee: new BigNumber(1000),
      });

      // Asserted by instance, not by message: a regex would have passed against
      // the invariant this replaced.
      await expect(sign(transaction)).rejects.toBeInstanceOf(ConcordiumTokenAccountUnavailable);
      expect(craftTransaction).not.toHaveBeenCalled();
    });

    // A `BigNumber` holding NaN is truthy, so the falsiness guard alone let it
    // through. What this pins is the ordering: the throw lands before any event.
    it("refuses a NaN fee before requesting the device", async () => {
      const { account, transaction } = tokenTransaction({ fee: new BigNumber(NaN) });

      const { events } = await sign(transaction, account).catch(e => {
        expect(e).toBeInstanceOf(FeeNotLoaded);
        return { events: [] as unknown[] };
      });

      expect(events).toHaveLength(0);
      expect(craftPltTransaction).not.toHaveBeenCalled();
    });

    // The energy half of the pair is missing, so the fee on screen has no
    // matching limit to sign; preparation could not have produced this.
    it("refuses a token transfer with no persisted energy", async () => {
      const { account, subAccount } = withTokenSubAccount();
      const transaction = createFixtureTransaction({
        subAccountId: subAccount.id,
        fee: new BigNumber(3600),
      });

      await expect(sign(transaction, account)).rejects.toThrow(FeeNotLoaded);
    });
  });
});
