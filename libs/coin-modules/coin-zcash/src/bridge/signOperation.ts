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
import { ZcashSignerNotSupported, ZcashSigningCancelled } from "../types/errors";
import { assertCanSend } from "../logic/engineClient";
import { craftIronwoodTransaction, craftTransaction } from "../logic/transaction/craftTransaction";
import { combine } from "../logic/transaction/combine";
import { mapOutputs, mapSpends, mapTransparentInputs } from "./mapping";
import { getWalletAccount } from "./getWalletAccount";
import { resolveTransparentUtxos } from "./statusHelpers";

// The V6 builder mirrors zcash-utils' own precondition: the transaction must carry
// an Ironwood bundle, which an Ironwood spend or an Ironwood output creates. Those
// are the flows below -- a shielded recipient resolves to the Ironwood pool there,
// which is where NU6.3 sends newly shielded funds.
//
// The other flows stay on the V5 builder: t→t has no shielded bundle at all, and
// the Orchard flows spend Orchard notes, which the V6 builder cannot take (its
// `spends` read each note's `position` from the Ironwood commitment tree).
const IRONWOOD_BUNDLE_TRANSFER_TYPES = new Set<Transaction["transferType"]>([
  "ironwood",
  "ironwood-to-transparent",
  "transparent-to-shielded",
]);

/**
 * The only bespoke residue of this bridge (kaspa-style): builds the PCZT
 * (`logic.craftTransaction` / `craftIronwoodTransaction`), signs it via the
 * device (`signerContext(...).signPcztTransaction`), and finalizes it
 * (`logic.combine`) into a broadcastable tx. Every Zcash flow -- including
 * transparent t→t -- goes through this single PCZT path; there is no legacy
 * PSBT fallback in coin-zcash.
 *
 * `logic.combine` still finalizes through the V5 path: @ledgerhq/zcash-utils
 * exposes no V6 counterpart, so a V6 PCZT gets as far as device signing.
 *
 * One flow has no builder at all past NU6.3: a shielded send to a third party
 * (z→z). It would need Orchard spends alongside an Ironwood output, and the V6
 * builder only takes Ironwood spends — NU6.3 makes the Orchard pool spendable but
 * no longer creditable.
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
        const buildResult = IRONWOOD_BUNDLE_TRANSFER_TYPES.has(transaction.transferType)
          ? await craftIronwoodTransaction(plan)
          : await craftTransaction(plan);

        if (bailIfCancelled()) return;

        subscriber.next({ type: "device-signature-requested" });
        const sigResult = await signerContext(deviceId, async signer => {
          if (typeof signer.signPcztTransaction !== "function") {
            throw new ZcashSignerNotSupported(
              "Zcash signing requires a signer exposing signPcztTransaction",
            );
          }
          return signer.signPcztTransaction(buildResult.pcztTransaction);
        });

        subscriber.next({ type: "device-signature-granted" });
        if (bailIfCancelled()) return;

        const orchardSignatures = sigResult.orchard.map(a =>
          Buffer.from(a.spendAuthSig).toString("hex"),
        );
        const transparentSignatures = sigResult.transparentInputSigs.map(sig =>
          Buffer.from(sig).toString("hex"),
        );

        const finalizeResult = await combine({
          pczt: buildResult.pcztHex,
          orchardSignatures,
          transparentSignatures,
        });

        if (bailIfCancelled()) return;

        const inputRefs: BtcInputRef[] = transparentUtxos.flatMap(utxo =>
          utxo.address !== null && utxo.address !== undefined && utxo.address !== ""
            ? [{ hash: utxo.hash, outputIndex: utxo.outputIndex, address: utxo.address }]
            : [],
        );

        const fee = new BigNumber(buildResult.feeZat);
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
