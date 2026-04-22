import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { BigNumber } from "bignumber.js";
import { Cbor, concat, requestIdOf } from "@zondax/ledger-live-icp/agent";
import {
  createUnsignedSendTransaction,
  deriveAddressFromPubkey,
  pubkeyToDer,
} from "@zondax/ledger-live-icp/utils";
import { broadcast } from "./broadcast";
import { ICP_FEES } from "../consts";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const identity = Secp256k1KeyIdentity.generate();
    const xpub = Buffer.from(new Uint8Array(identity.getPublicKey().toRaw())).toString("hex");
    const freshAddress = deriveAddressFromPubkey(xpub);
    const transaction = {
      amount: new BigNumber(100_000_000),
      recipient: freshAddress,
      fees: new BigNumber(ICP_FEES),
    } as any;
    const { unsignedTransaction } = createUnsignedSendTransaction(transaction, xpub);
    const domainSeparator = new TextEncoder().encode("\x0Aic-request");
    const rid = requestIdOf(unsignedTransaction as Record<string, unknown>);
    const domainBuf = domainSeparator.buffer.slice(
      domainSeparator.byteOffset,
      domainSeparator.byteOffset + domainSeparator.byteLength,
    ) as ArrayBuffer;
    const challenge = new Uint8Array(concat(domainBuf, rid));
    const sig = await identity.sign(
      challenge.buffer.slice(challenge.byteOffset, challenge.byteOffset + challenge.byteLength),
    );
    const signatureRS = Buffer.from(sig);
    const callBody = {
      content: unsignedTransaction,
      sender_pubkey: pubkeyToDer(xpub),
      sender_sig: signatureRS,
    };
    const encodedSignedCallBlob = Buffer.from(Cbor.encode(callBody)).toString("hex");
    const transferRequestIdHex = Buffer.from(requestIdOf(unsignedTransaction)).toString("hex");

    await expect(
      broadcast({
        signedOperation: {
          operation: { extra: { memo: transaction.memo } },
          rawData: { encodedSignedCallBlob, transferRequestIdHex },
        },
      } as any),
    ).rejects.toThrow(/InsufficientFunds/);
  });
});
