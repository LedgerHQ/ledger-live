import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type {
  AccountBridge,
  Operation,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Transaction, ZcashAccount, BtcInputRef, ZcashOperationExtra } from "../types/bridge";
import type { SignerContext } from "../types/signer";
import {
  ZcashNotesNotYetSpendable,
  ZcashShieldedKeyMissing,
  ZcashSignerNotSupported,
  ZcashSigningCancelled,
} from "../types/errors";
import { accountPubkeyFromXpub } from "../signer/xpub";
import { assertCanSend } from "../logic/engineClient";
import { craftIronwoodTransaction, craftTransaction } from "../logic/transaction/craftTransaction";
import { combine } from "../logic/transaction/combine";
import { mapOutputs, mapSpends, mapTransparentInputs } from "./mapping";
import { getWalletAccount } from "./getWalletAccount";
import { resolveTransparentUtxos } from "./statusHelpers";
import { reserveNotes } from "./note-reservation";

// The V6 builder mirrors zcash-utils' own precondition: the transaction must carry
// an Ironwood bundle, which an Ironwood spend or an Ironwood output creates. Those
// are the flows below -- a shielded send spends Ironwood notes ("shielded",
// "shielded-to-transparent") and a shielded recipient resolves to the Ironwood
// pool ("transparent-to-shielded"), which is where NU6.3 sends newly shielded funds.
//
// Only t→t ("transparent") stays on the V5 builder: it has no shielded bundle at all.
const IRONWOOD_BUNDLE_TRANSFER_TYPES = new Set<Transaction["transferType"]>([
  "shielded",
  "shielded-to-transparent",
  "transparent-to-shielded",
]);

/**
 * The builder's stable marker for a note whose leaf position is at or past the
 * number of leaves the Ironwood tree held at its anchor -- the position-range
 * rejection the maturity filter is meant to make unreachable (see
 * `types/errors.ts`'s `ZcashNotesNotYetSpendable`). Matched on the message
 * because the IPC wrapper carries the Rust error through verbatim, with no
 * structured code.
 */
function isNotePositionPastAnchor(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("compute_ironwood_witnesses") && message.includes("anchor_total_leaves");
}

/**
 * A shielded bundle can only be built from the account's shielded keys, so the
 * UFVK is mandatory there -- and it only reaches the wallet through the export
 * flow, which the user has to confirm on the device.
 */
function requireUfvk(ufvk: string | undefined): string {
  if (!ufvk) throw new ZcashShieldedKeyMissing();
  return ufvk;
}

/**
 * The account key material a transparent send needs, in whichever form the
 * account can supply: the UFVK when it has one, otherwise the account's
 * transparent pubkey read off its xpub.
 *
 * Both forms describe the same account and derive the same change address and
 * signing paths; the UFVK is preferred when present so that an account which has
 * one keeps a single code path across all its flows.
 */
function resolveAccountKey(
  account: ZcashAccount,
  ufvk: string | undefined,
): { ufvk: string } | { transparentAccountPubkey: string } {
  // Truthiness, like `requireUfvk`: an empty viewing key is no key.
  if (ufvk) return { ufvk };
  // Every synced account is built from its xpub, so this is an invariant
  // violation rather than a state the user can reach or resolve.
  if (!account.xpub) throw new Error("Missing xpub -- cannot derive the account's transparent key");
  return { transparentAccountPubkey: accountPubkeyFromXpub(account.xpub) };
}

/**
 * The only bespoke residue of this bridge (kaspa-style): builds the PCZT
 * (`logic.craftTransaction` / `craftIronwoodTransaction`), signs it via the
 * device (`signerContext(...).signPcztTransaction`), and finalizes it
 * (`logic.combine`) into a broadcastable tx. Every Zcash flow -- including
 * transparent t→t -- goes through this single PCZT path; there is no legacy
 * PSBT fallback in coin-zcash.
 *
 * Every shielded send spends the Ironwood pool, so z→z and z→t both build as V6
 * PCZTs (Ironwood spends). The deprecated Sapling/Orchard send flows are gone.
 *
 * V5 and V6 share this path up to and including finalization: `logic.combine`
 * finalizes either (@ledgerhq/zcash-utils >= 2.0.0 injects Ironwood spend-auth
 * signatures and extracts a V6 transaction), and the device-signing step is
 * identical -- only which bundle carries the spends differs.
 *
 * Broadcast is the exception, and it is the current end of the V6 road: the
 * pinned zcash-utils (2.1.0) still derives the txid through a V5-only guard, so
 * it rejects a V6 transaction after the user has already signed. Every shielded
 * send therefore builds, signs and finalizes but cannot be broadcast until a
 * zcash-utils release carries that fix.
 */
export const buildSignOperation =
  (signerContext: SignerContext): AccountBridge<Transaction, ZcashAccount>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable<SignOperationEvent>(subscriber => {
      let cancelled = false;
      const abort = (): void => {
        cancelled = true;
      };
      const bailIfCancelled = (): boolean => {
        if (!cancelled) return false;
        if (!subscriber.closed) subscriber.error(new ZcashSigningCancelled());
        return true;
      };

      (async () => {
        const useIronwood = IRONWOOD_BUNDLE_TRANSFER_TYPES.has(transaction.transferType);
        // Absent until the user exports it from the device, so only the flows
        // that genuinely read shielded key material may depend on it: a
        // transparent send identifies its account by the xpub instead, and stays
        // available to an account that holds nothing but public funds.
        //
        // An account can carry an empty string rather than null, which is why the
        // shielded scan gates on its length too (`sync.ts`'s `ufvkIsPresent`).
        // Normalising here keeps the two readers below agreeing on what
        // "present" means: without it a transparent send would forward `ufvk: ""`
        // to the builder and fail decoding a viewing key it never needed.
        const ufvk = account.privateInfo?.ufvk || undefined;
        if (!transaction.selectedNotes)
          throw new Error("Missing selectedNotes -- run prepareTransaction first");
        if (transaction.zcashFee === undefined)
          throw new Error("Missing zcashFee -- run prepareTransaction first");

        await assertCanSend();

        const accountIndex = getWalletAccount(account).params.index;
        const transparentUtxos = resolveTransparentUtxos(account, transaction);
        const transparentInputs = await mapTransparentInputs(account, transparentUtxos);
        if (bailIfCancelled()) return;

        const plan = {
          accountIndex,
          feeZat: transaction.zcashFee.toFixed(0),
          spends: mapSpends(transaction.selectedNotes),
          transparentInputs,
          outputs: mapOutputs(transaction),
        };

        const buildResult = useIronwood
          ? await craftIronwoodTransaction({ ...plan, ufvk: requireUfvk(ufvk) }).catch(err => {
              if (isNotePositionPastAnchor(err)) throw new ZcashNotesNotYetSpendable();
              throw err;
            })
          : await craftTransaction({ ...plan, ...resolveAccountKey(account, ufvk) });

        const { pcztTransaction } = buildResult;

        if (bailIfCancelled()) return;

        subscriber.next({ type: "device-signature-requested" });
        const sigResult = await signerContext(deviceId, async signer => {
          if (typeof signer.signPcztTransaction !== "function") {
            throw new ZcashSignerNotSupported(
              "Zcash signing requires a signer exposing signPcztTransaction",
            );
          }
          return signer.signPcztTransaction(pcztTransaction);
        });

        subscriber.next({ type: "device-signature-granted" });
        if (bailIfCancelled()) return;

        const orchardSignatures = sigResult.orchard.map(a =>
          Buffer.from(a.spendAuthSig).toString("hex"),
        );
        const transparentSignatures = sigResult.transparentInputSigs.map(sig =>
          Buffer.from(sig).toString("hex"),
        );
        const ironwoodSignatures = sigResult.ironwood.map(a =>
          Buffer.from(a.spendAuthSig).toString("hex"),
        );

        const finalizeResult = await combine({
          pczt: buildResult.pcztHex,
          orchardSignatures,
          transparentSignatures,
          ...(ironwoodSignatures.length > 0 ? { ironwoodSignatures } : {}),
        });

        if (bailIfCancelled()) return;

        const inputRefs: BtcInputRef[] = transparentUtxos.flatMap(utxo =>
          utxo.address !== null && utxo.address !== undefined && utxo.address !== ""
            ? [{ hash: utxo.hash, outputIndex: utxo.outputIndex, address: utxo.address }]
            : [],
        );

        const fee = new BigNumber(buildResult.feeZat);

        const ironwoodNullifiers = transaction.selectedNotes.map(n => n.nullifier);
        if (ironwoodNullifiers.length > 0) {
          reserveNotes(account.id, finalizeResult.txid, ironwoodNullifiers);
        }

        const operation: Operation = {
          id: encodeOperationId(account.id, finalizeResult.txid, "OUT"),
          hash: finalizeResult.txid,
          type: "OUT",
          value: transaction.amount.plus(fee),
          fee,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient].filter(Boolean),
          accountId: account.id,
          date: new Date(),
          extra: {
            zcashShielded: true,
            ...(ironwoodNullifiers.length > 0 && { shieldedNullifiers: ironwoodNullifiers }),
            ...(inputRefs.length > 0 && {
              inputs: inputRefs.map(r => `${r.hash}-${r.outputIndex}`),
              inputRefs,
            }),
            ...(transaction.memo && { memo: transaction.memo }),
          } satisfies ZcashOperationExtra,
        };

        const signedOperation: SignedOperation = { operation, signature: finalizeResult.txHex };
        subscriber.next({ type: "signed", signedOperation });
        subscriber.complete();
      })().catch(err => subscriber.error(err));

      return abort;
    });
