import { serializeSignDoc, StdSignDoc } from "@cosmjs/amino";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { ExpertModeRequired, UserRefusedOnDevice } from "@ledgerhq/errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import cryptoFactory from "./chain/chain";
import { CosmosAccount, RETURN_CODES, Transaction } from "./types";
import { CosmosSignatureSdk, CosmosSigner } from "./types/signer";

// Minimal structural guard so a malformed payload fails with a clear message
// instead of a cryptic serializeSignDoc error. Full param validation (Zod) lives
// in the live-app (WalletConnect) layer.
function assertValidStdSignDoc(doc: unknown): asserts doc is StdSignDoc {
  const d = doc as Partial<StdSignDoc> | null;
  if (!d || typeof d !== "object") {
    throw new Error("signRawOperation: signDoc must be a JSON object");
  }
  if (typeof d.chain_id !== "string") {
    throw new Error("signRawOperation: signDoc.chain_id must be a string");
  }
  if (typeof d.account_number !== "string" || typeof d.sequence !== "string") {
    throw new Error("signRawOperation: signDoc.account_number and sequence must be strings");
  }
  if (typeof d.memo !== "string") {
    throw new Error("signRawOperation: signDoc.memo must be a string");
  }
  if (!d.fee || !Array.isArray(d.fee.amount) || typeof d.fee.gas !== "string") {
    throw new Error("signRawOperation: signDoc.fee must have { amount: [], gas }");
  }
  if (!Array.isArray(d.msgs) || d.msgs.length === 0) {
    throw new Error("signRawOperation: signDoc.msgs must be a non-empty array");
  }
}

// `transaction` is a JSON-serialized amino `StdSignDoc`, built entirely by the
// dApp (via WalletConnect `cosmos_signAmino`). We sign the canonical serialized
// bytes verbatim — no re-fetching of account number / sequence / chain id / fee
// — and return the detached 64-byte secp256k1 signature (hex). The caller pairs
// it with the account public key and broadcasts; this method never broadcasts.
export const buildSignRawOperation =
  (
    signerContext: SignerContext<CosmosSigner>,
  ): AccountBridge<Transaction, CosmosAccount>["signRawOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      let cancelled = false;
      async function main() {
        const chainInstance = cryptoFactory(account.currency.id);

        let signDoc: StdSignDoc;
        try {
          signDoc = JSON.parse(transaction);
        } catch (e) {
          throw new Error(
            `signRawOperation: transaction is not valid JSON (${(e as Error).message})`,
          );
        }
        assertValidStdSignDoc(signDoc);
        const tx = Buffer.from(serializeSignDoc(signDoc));
        const path = account.freshAddressPath.split("/").map(p => parseInt(p.replace("'", "")));

        o.next({ type: "device-signature-requested" });

        const { signature: resSignature, return_code } = (await signerContext(
          deviceId,
          async signer =>
            // HRP is only needed when signing for ethermint chains.
            path[1] === 60 ? signer.sign(path, tx, chainInstance.prefix) : signer.sign(path, tx),
        )) as CosmosSignatureSdk;

        switch (return_code) {
          case RETURN_CODES.EXPERT_MODE_REQUIRED:
            throw new ExpertModeRequired();
          case RETURN_CODES.REFUSED_OPERATION:
            throw new UserRefusedOnDevice();
        }

        o.next({ type: "device-signature-granted" });

        // DER → fixed 64-byte r‖s, hex-encoded.
        const signature = Buffer.from(
          Secp256k1Signature.fromDer(resSignature).toFixedLength(),
        ).toString("hex");

        if (cancelled) {
          return;
        }

        // Optimistic operation: the real tx is assembled and broadcast by the
        // dApp, so we only have a placeholder here.
        const accountId = account.id;
        const hash = "";
        const operation: Operation = {
          id: encodeOperationId(accountId, hash, "OUT"),
          hash,
          type: "OUT",
          value: new BigNumber(0),
          fee: new BigNumber(0),
          extra: {},
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [],
          accountId,
          date: new Date(),
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignRawOperation;
