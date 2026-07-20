import { serializeSignDoc, StdSignDoc } from "@cosmjs/amino";
import { Secp256k1Signature } from "@cosmjs/crypto";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { ExpertModeRequired } from "./errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, Operation, SignOperationEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable, Observer } from "rxjs";
import cryptoFactory from "./chain/chain";
import { CosmosAccount, RETURN_CODES, Transaction } from "./types";
import { CosmosSignature, CosmosSigner } from "./types/signer";

// Minimal structural guard so a malformed payload fails with a clear message
// instead of a cryptic serializeSignDoc error. Full param validation (Zod) lives
// in the live-app (WalletConnect) layer.
function assertValidStdSignDoc(doc: unknown): asserts doc is StdSignDoc {
  const d = doc as Partial<StdSignDoc> | null;
  if (!d || typeof d !== "object") {
    throw new TypeError("signRawOperation: signDoc must be a JSON object");
  }
  if (typeof d.chain_id !== "string") {
    throw new TypeError("signRawOperation: signDoc.chain_id must be a string");
  }
  if (typeof d.account_number !== "string" || typeof d.sequence !== "string") {
    throw new TypeError("signRawOperation: signDoc.account_number and sequence must be strings");
  }
  if (typeof d.memo !== "string") {
    throw new TypeError("signRawOperation: signDoc.memo must be a string");
  }
  if (!d.fee || !Array.isArray(d.fee.amount) || typeof d.fee.gas !== "string") {
    throw new TypeError("signRawOperation: signDoc.fee must have { amount: [], gas }");
  }
  if (!Array.isArray(d.msgs) || d.msgs.length === 0) {
    throw new TypeError("signRawOperation: signDoc.msgs must be a non-empty array");
  }
}

function parseDerivationPath(freshAddressPath: string): number[] {
  const path = freshAddressPath
    .split("/")
    .map(segment => Number.parseInt(segment.replace(/'/g, ""), 10));
  if (path.length < 2 || path.some(Number.isNaN)) {
    throw new Error(`signRawOperation: malformed derivation path "${freshAddressPath}"`);
  }
  return path;
}

function signTransaction(
  signerContext: SignerContext<CosmosSigner>,
  deviceId: string,
  path: number[],
  tx: Buffer,
  prefix: string,
): Promise<CosmosSignature> {
  return signerContext(deviceId, signer =>
    // HRP is only needed when signing for ethermint chains.
    path[1] === 60 ? signer.sign(path, tx, prefix) : signer.sign(path, tx),
  );
}

async function performSignRawOperation(
  signerContext: SignerContext<CosmosSigner>,
  account: CosmosAccount,
  deviceId: string,
  transaction: string,
  observer: Observer<SignOperationEvent>,
  isCancelled: () => boolean,
): Promise<void> {
  const chainInstance = cryptoFactory(account.currency.id);

  let signDoc: StdSignDoc;
  try {
    signDoc = JSON.parse(transaction);
  } catch (e) {
    throw new Error(`signRawOperation: transaction is not valid JSON (${(e as Error).message})`);
  }
  assertValidStdSignDoc(signDoc);
  const tx = Buffer.from(serializeSignDoc(signDoc));
  const path = parseDerivationPath(account.freshAddressPath);

  observer.next({ type: "device-signature-requested" });

  const { signature: resSignature, return_code } = await signTransaction(
    signerContext,
    deviceId,
    path,
    tx,
    chainInstance.prefix,
  );

  switch (return_code) {
    case RETURN_CODES.EXPERT_MODE_REQUIRED:
      throw new ExpertModeRequired();
    case RETURN_CODES.REFUSED_OPERATION:
      throw new UserRefusedOnDevice();
  }
  if (!resSignature) {
    // Defensive: an unhandled non-success return_code can still carry a null signature;
    // fail clearly instead of letting Secp256k1Signature.fromDer throw on null.
    throw new Error(`signRawOperation: device returned no signature (return_code ${return_code})`);
  }

  // DER → fixed 64-byte r‖s, hex-encoded.
  const signature = Buffer.from(Secp256k1Signature.fromDer(resSignature).toFixedLength()).toString(
    "hex",
  );

  // Mirror signOperation: don't emit any post-device event once unsubscribed.
  if (isCancelled()) {
    return;
  }

  observer.next({ type: "device-signature-granted" });

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

  observer.next({
    type: "signed",
    signedOperation: {
      operation,
      signature,
    },
  });
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
      performSignRawOperation(
        signerContext,
        account,
        deviceId,
        transaction,
        o,
        () => cancelled,
      ).then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignRawOperation;
