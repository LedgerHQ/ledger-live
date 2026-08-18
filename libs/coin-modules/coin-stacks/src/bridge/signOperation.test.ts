import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account } from "@ledgerhq/types-live";
import { AnchorMode, deserializeTransaction } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { InvalidNonce } from "../errors";
import type { StacksSigner, Transaction } from "../types";
import { buildSignOperation } from "./signOperation";
import { createTransaction } from "./utils/transactions";
import type { StacksNetwork } from "../network/api";

const mockAccount = {
  id: "stacks-account-1",
  freshAddress: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQVX8X0G",
  freshAddressPath: "44'/5757'/0'/0/0",
  xpub: "0217a5c9c5a5b0e5b8b8b3b0d5b8b8b3b0d5b8b8b3b0d5b8b8b3b0d5b8b8b3b0d5",
  currency: { name: "Stacks" },
  subAccounts: undefined,
} as unknown as Account;

const mockTransaction: Transaction = {
  family: "stacks",
  amount: new BigNumber("1000000"),
  recipient: "SP34SVHFFP532M35DHWTQJKJJR2DRGS7T5XEXQ0M0",
  fee: new BigNumber("180"),
  nonce: new BigNumber("3"),
  network: "mainnet" as keyof typeof StacksNetwork,
  anchorMode: AnchorMode.Any,
};

describe("buildSignOperation", () => {
  it("throws FeeNotLoaded when fee is not set", done => {
    const signerContext: SignerContext<StacksSigner> = jest.fn();
    const signOperation = buildSignOperation(signerContext);

    signOperation({
      account: mockAccount,
      transaction: { ...mockTransaction, fee: undefined },
      deviceId: "device-1",
    }).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(FeeNotLoaded);
        done();
      },
      complete: () => done.fail("should have thrown FeeNotLoaded"),
    });
  });

  it("throws InvalidNonce when nonce is not set", done => {
    const signerContext: SignerContext<StacksSigner> = jest.fn();
    const signOperation = buildSignOperation(signerContext);

    signOperation({
      account: mockAccount,
      transaction: { ...mockTransaction, nonce: undefined },
      deviceId: "device-1",
    }).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(InvalidNonce);
        done();
      },
      complete: () => done.fail("should have thrown InvalidNonce"),
    });
  });

  it("throws when xpub is missing", done => {
    const signerContext: SignerContext<StacksSigner> = jest.fn();
    const signOperation = buildSignOperation(signerContext);

    signOperation({
      account: { ...mockAccount, xpub: undefined } as unknown as Account,
      transaction: mockTransaction,
      deviceId: "device-1",
    }).subscribe({
      error: err => {
        expect(err).toBeInstanceOf(Error);
        done();
      },
      complete: () => done.fail("should have thrown"),
    });
  });

  it("signs a hex-decoded serialized transaction, not a utf8-encoded one", done => {
    let capturedBuffer: Buffer | undefined;

    const signerContext: SignerContext<StacksSigner> = jest.fn(async (_deviceId, fn) => {
      const signer: StacksSigner = {
        showAddressAndPubKey: jest.fn(),
        getAddressAndPubKey: jest.fn(),
        sign: jest.fn((_path: string, message: Buffer) => {
          capturedBuffer = message;
          return Promise.resolve({
            returnCode: 0x9000,
            errorMessage: "",
            signatureVRS: Buffer.alloc(65, 1),
          });
        }),
      };
      return fn(signer);
    });

    const signOperation = buildSignOperation(signerContext);

    signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: "device-1",
    }).subscribe({
      complete: async () => {
        // Build the same unsigned tx independently to get its real (pre-signature) byte length --
        // signing fills a fixed-size slot rather than growing the transaction, so the signed
        // buffer's length should stay close to this, not ~2x it.
        const referenceTx = await createTransaction(
          mockTransaction,
          mockAccount.freshAddress,
          mockAccount.xpub as string,
          undefined,
          mockTransaction.fee,
          mockTransaction.nonce,
        );
        const unsignedByteLength = referenceTx.serialize().length / 2;

        expect(capturedBuffer?.length).toBeLessThan(unsignedByteLength * 1.5);
        expect(() => deserializeTransaction(capturedBuffer!.toString("hex"))).not.toThrow();
        done();
      },
      error: done.fail,
    });
  });

  it("emits device-signature-requested then device-signature-granted then signed", done => {
    const signerContext: SignerContext<StacksSigner> = jest.fn(async (_deviceId, fn) => {
      const signer: StacksSigner = {
        showAddressAndPubKey: jest.fn(),
        getAddressAndPubKey: jest.fn(),
        sign: jest.fn().mockResolvedValue({
          returnCode: 0x9000,
          errorMessage: "",
          signatureVRS: Buffer.alloc(65, 2),
        }),
      };
      return fn(signer);
    });

    const signOperation = buildSignOperation(signerContext);
    const events: string[] = [];

    signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: "device-1",
    }).subscribe({
      next: event => events.push(event.type),
      complete: () => {
        expect(events).toEqual([
          "device-signature-requested",
          "device-signature-granted",
          "signed",
        ]);
        done();
      },
      error: done.fail,
    });
  });

  it("throws when the device returns a non-success return code", done => {
    const signerContext: SignerContext<StacksSigner> = jest.fn(async (_deviceId, fn) => {
      const signer: StacksSigner = {
        showAddressAndPubKey: jest.fn(),
        getAddressAndPubKey: jest.fn(),
        sign: jest.fn().mockResolvedValue({
          returnCode: 0x6a80,
          errorMessage: "device rejected",
        }),
      };
      return fn(signer);
    });

    const signOperation = buildSignOperation(signerContext);

    signOperation({
      account: mockAccount,
      transaction: mockTransaction,
      deviceId: "device-1",
    }).subscribe({
      error: err => {
        expect(err.message).toContain("device rejected");
        done();
      },
      complete: () => done.fail("should have thrown on device error"),
    });
  });
});
