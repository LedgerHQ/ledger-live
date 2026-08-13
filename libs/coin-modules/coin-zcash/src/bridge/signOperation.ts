import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type {
  AccountBridge,
  Operation,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import type { PcztTransaction } from "@ledgerhq/live-signer-zcash";
import type { Transaction, ZcashAccount, BtcInputRef, ZcashOperationExtra } from "../types/bridge";
import type { SignerContext } from "../types/signer";
import { ZcashSignerNotSupported, ZcashSigningCancelled } from "../types/errors";
import { assertCanSend } from "../logic/engineClient";
import { craftIronwoodTransaction, craftTransaction } from "../logic/transaction/craftTransaction";
import { combine } from "../logic/transaction/combine";
import { mapOutputs, mapSpends, mapTransparentInputs } from "./mapping";
import { getWalletAccount } from "./getWalletAccount";
import { resolveTransparentUtxos } from "./statusHelpers";
import { reserveNotes } from "./note-reservation";
import { ZCASH_LOG_TYPE } from "../constants";

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

// ── Log-only projections of the PCZT ────────────────────────────────────
//
// Zcash is a shielded chain and `@ledgerhq/logs` output is what a user attaches
// to a bug report, so these carry the transaction's *shape* -- version, bundle
// presence, action and input/output counts -- and deliberately never the note
// plaintexts or a bundle's value balance. Shape is what diagnoses a build or
// broadcast failure; the amounts would only widen what an exported log reveals.
//
// They also keep the signing flow readable: built inline, these payloads put
// their branching inside the send path's own control flow.

/** Formats a u32 as `0xXXXXXXXX`, tolerating a field the native layer omitted. */
function hexU32(value: number | undefined): string {
  return typeof value === "number"
    ? `0x${value.toString(16).padStart(8, "0").toUpperCase()}`
    : "absent";
}

/** Which pools the PCZT carries, and how many actions each holds. */
function describeBundles(pczt: PcztTransaction): Record<string, unknown> {
  const { orchardBundle, ironwoodBundle } = pczt;
  return {
    orchardBundle: orchardBundle ? { nActions: orchardBundle.actions.length } : null,
    ironwoodBundle: ironwoodBundle
      ? { nActions: ironwoodBundle.actions.length, flags: ironwoodBundle.flags }
      : null,
  };
}

/** Version, consensus identifiers and bundle/transparent shape. */
function describePczt(pczt: PcztTransaction): Record<string, unknown> {
  return {
    txVersion: pczt.global.txVersion,
    versionGroupId: hexU32(pczt.global.versionGroupId),
    consensusBranchId: hexU32(pczt.global.consensusBranchId),
    ...describeBundles(pczt),
    nTransparentInputs: pczt.transparentInputs.length,
    nTransparentOutputs: pczt.transparentOutputs.length,
  };
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
        const ufvk = account.privateInfo?.ufvk;
        if (!ufvk) throw new Error("Missing UFVK -- account not yet synced");
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
          ufvk,
          accountIndex,
          feeZat: transaction.zcashFee.toFixed(0),
          spends: mapSpends(transaction.selectedNotes),
          transparentInputs,
          outputs: mapOutputs(transaction),
        };

        const useIronwood = IRONWOOD_BUNDLE_TRANSFER_TYPES.has(transaction.transferType);
        log(ZCASH_LOG_TYPE, "[signOp] plan assembled", {
          transferType: transaction.transferType,
          useIronwood,
          accountIndex,
          feeZat: plan.feeZat,
          nSpends: plan.spends.length,
          nTransparentInputs: plan.transparentInputs.length,
          nOutputs: plan.outputs.length,
        });

        log(
          ZCASH_LOG_TYPE,
          `[signOp] calling ${useIronwood ? "craftIronwoodTransaction" : "craftTransaction"}…`,
        );
        const buildResult = useIronwood
          ? await craftIronwoodTransaction(plan)
          : await craftTransaction(plan);
        log(ZCASH_LOG_TYPE, "[signOp] build result received", {
          pcztHexLen: buildResult.pcztHex.length,
          feeZat: buildResult.feeZat,
          ...("nActionsIronwood" in buildResult
            ? { nActionsIronwood: buildResult.nActionsIronwood }
            : { nActionsOrchard: (buildResult as { nActionsOrchard: number }).nActionsOrchard }),
          nTransparentInputs: buildResult.nTransparentInputs,
          nTransparentOutputs: buildResult.nTransparentOutputs,
        });

        const { pcztTransaction } = buildResult;
        log(ZCASH_LOG_TYPE, "[signOp] pcztTransaction shape", describePczt(pcztTransaction));

        if (bailIfCancelled()) return;

        // Last log before control crosses into the DMK: if a bug report ends
        // here, the device call is where it stopped.
        // versionGroupId 0xD884B698 is V6 (Ironwood/NU6.3); the firmware must be
        // built with zcash_unstable to accept it.
        log(ZCASH_LOG_TYPE, "[signOp] calling signPcztTransaction on device", {
          deviceId,
          ...describePczt(pcztTransaction),
        });
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
          } satisfies ZcashOperationExtra,
        };

        const signedOperation: SignedOperation = { operation, signature: finalizeResult.txHex };
        subscriber.next({ type: "signed", signedOperation });
        subscriber.complete();
      })().catch(err => subscriber.error(err));

      return abort;
    });
