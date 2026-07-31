import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import type {
  Account,
  AccountRaw,
  Operation,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import {
  encodeOperationId,
  patchOperationWithHash,
} from "@ledgerhq/ledger-wallet-framework/operation";
import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { ChainAdapter, ResolvedTransactions } from "../types";
import type { BitcoinAddress, BitcoinSigner, BitcoinXPub, SignerContext } from "../../signer";
import type {
  Transaction,
  TransactionStatus,
  BitcoinAccount,
  BitcoinOutput,
  BtcInputRef,
  BtcOperationExtra,
} from "../../types";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import type {
  ZcashAddress,
  ZcashViewKey,
  PcztTransaction,
  SignPcztTransactionResult,
} from "@ledgerhq/live-signer-zcash";
import { registerChainAdapter } from "../registry";
import type {
  BuildTransactionArgs,
  SpendableNote,
  ZcashAccount,
  ZcashAccountRaw,
  ZcashTransaction,
  ZcashTransferType,
} from "./types";
import { isZcashTransaction } from "./types";
import { classifyZcashRecipient } from "./address";
import {
  ZcashSaplingRecipientNotSupported,
  ZcashSignerNotSupported,
  ZcashSigningCancelled,
  ZcashUtxoNotInAccount,
} from "../../errors";
import {
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";
import { collectSpendableNotes, collectIronwoodSpendableNotes } from "./operations";
import {
  selectNotes,
  estimateMaxSpendableAmount,
  selectTransparentInputs,
  estimateMaxSpendableTransparent,
  ZIP317_MINIMUM_FEE,
} from "./coin-selection";
import { composeXpub } from "./xpub";
import { computeZcashBalance } from "./balance";
import { getWalletAccount } from "../../getWalletAccount";
import type { TX } from "@ledgerhq/wallet-btc/index";
import { getZainoEndpoint, isZcashShieldedEnabled } from "./constants";
import { resolveTransactionDetails } from "./transaction-details";
import { resolveZcashFeePerByte } from "./transparent-fee-rate";

// ── Lazy module import (renderer-safe) ────────────────────────────────────
//
// ZCash.ts transitively loads the native .node addon. In the Electron renderer
// rspack aliases this import to ZCashIPC so the IPC client is used instead.
// Keeping it lazy avoids bundling the native addon in the renderer.

type ZCashModule = {
  createZCashClient: (args: { grpcUrl: string; network?: string }) => import("./types").ZCashClient;
};

let zcashClientModuleCache: Promise<ZCashModule> | null = null;

function getZCashModule(): Promise<ZCashModule> {
  zcashClientModuleCache ??= import(
    /* webpackChunkName: "zcash-native" */ "@ledgerhq/coin-bitcoin/chain-adapters/zcash/ZCash"
  ) as Promise<ZCashModule>;
  return zcashClientModuleCache;
}

// ── PCZT signing helpers ───────────────────────────────────────────────────

type OrchardSpendInputJs = BuildTransactionArgs["spends"][number];
type TransparentInputJs = BuildTransactionArgs["transparentInputs"][number];
type OutputRequestJs = BuildTransactionArgs["outputs"][number];

function mapSpends(notes: SpendableNote[]): OrchardSpendInputJs[] {
  return notes.map(note => ({
    recipient: note.recipient,
    valueZat: note.amount.toFixed(0),
    rho: note.rho,
    rseed: note.rseed,
    cmx: note.cmx,
    position: note.position,
  }));
}

// Transfer types that actually spend transparent UTXOs as inputs. A pure
// shielded send ("shielded" / "shielded-to-transparent") spends Orchard notes
// only and must never pull in the account's transparent UTXOs — so only these
// types resolve to a non-empty transparent input set.
//
// "transparent" (Public→Public t→t) is included: with the zcashShielded flag on
// it is built as a V5 PCZT that spends transparent UTXOs into a transparent
// output, so it shares the exact same transparent-input machinery as
// "transparent-to-shielded" (only the recipient's address class differs). When
// the flag is off it never reaches this code — every routing hook returns
// `undefined` first and the legacy Bitcoin path takes over.
const TRANSPARENT_INPUT_TRANSFER_TYPES = new Set<ZcashTransferType>([
  "transparent-to-shielded",
  "transparent",
]);

const isTransparentInputTransfer = (transferType: ZcashTransferType): boolean =>
  TRANSPARENT_INPUT_TRANSFER_TYPES.has(transferType);

/**
 * Resolves the transparent UTXOs spent by a Public→* flow. Returns an empty set
 * for transfer types that do not spend transparent inputs, so an account holding
 * transparent UTXOs cannot leak them into an Orchard-note-only send. For the
 * flows that do spend transparent inputs, caller-provided `selectedUtxos` takes
 * precedence over the account's synced UTXO set. Kept as a single helper so the
 * PCZT builder inputs and the optimistic operation's `inputRefs` are always
 * derived from the exact same set.
 */
function resolveTransparentUtxos(account: ZcashAccount, tx: ZcashTransaction): BitcoinOutput[] {
  if (!TRANSPARENT_INPUT_TRANSFER_TYPES.has(tx.transferType)) return [];
  return tx.selectedUtxos ?? account.bitcoinResources?.utxos ?? [];
}

// Note-selection flows (Ironwood + Orchard-shielded). Ironwood spends Ironwood
// notes ("ironwood" / "ironwood-to-transparent"), shielded spends Orchard notes
// ("shielded" / "shielded-to-transparent").
const IRONWOOD_TRANSFER_TYPES = new Set<ZcashTransferType>(["ironwood", "ironwood-to-transparent"]);
const SHIELDED_TRANSFER_TYPES = new Set<ZcashTransferType>(["shielded", "shielded-to-transparent"]);

// Strip any stale fee/change from a prior prepare and reset the amount so the UI
// never shows a spendable amount without a matching fee.
function resetPreparedTransaction(tx: ZcashTransaction, amount: BigNumber): ZcashTransaction {
  const { zcashFee: _, changeAmount: __, ...rest } = tx;
  return {
    ...rest,
    amount,
    selectedNotes: [],
  } as ZcashTransaction;
}

// Prepare a transparent-input flow (Public→*): ZIP-317 fee/change resolution over
// transparent UTXOs, with no Orchard note selection.
function prepareTransparentTransaction(
  zcashAccount: ZcashAccount,
  tx: ZcashTransaction,
): ZcashTransaction {
  const utxoValues = resolveTransparentUtxos(zcashAccount, tx).map(utxo => utxo.value);
  // When useAllAmount is set, the effective amount is the max spendable over the
  // current UTXO set — recomputed here so it stays coherent even if a prior
  // prepare mutated tx.amount and the UTXOs have since changed.
  const effectiveAmount = tx.useAllAmount
    ? estimateMaxSpendableTransparent(utxoValues, tx.transferType)
    : tx.amount;
  const result = selectTransparentInputs(
    utxoValues,
    effectiveAmount,
    !!tx.useAllAmount,
    tx.transferType,
  );
  if (!result) return resetPreparedTransaction(tx, effectiveAmount);
  return {
    ...tx,
    amount: effectiveAmount,
    selectedNotes: [], // transparent inputs — no Orchard note spends
    zcashFee: result.fee,
    changeAmount: result.changeAmount,
  } as ZcashTransaction;
}

// Prepare a note-selection flow (Ironwood or Orchard-shielded). Both share the
// same pipeline; only the collected note set differs.
function prepareNoteTransaction(notes: SpendableNote[], tx: ZcashTransaction): ZcashTransaction {
  // When useAllAmount is set, compute the effective amount from max spendable.
  const effectiveAmount = tx.useAllAmount
    ? estimateMaxSpendableAmount(notes, tx.transferType)
    : tx.amount;
  if (effectiveAmount.lte(0)) return resetPreparedTransaction(tx, effectiveAmount);
  const result = selectNotes(notes, effectiveAmount, tx.transferType);
  if (!result) return resetPreparedTransaction(tx, effectiveAmount);
  return {
    ...tx,
    amount: effectiveAmount,
    selectedNotes: result.selectedNotes,
    zcashFee: result.fee,
    changeAmount: result.changeAmount,
  } as ZcashTransaction;
}

/**
 * Maps wallet UTXOs to the transparent-input shape the PCZT builder expects.
 *
 * Must be async: `crypto.getPubkeyAt` returns `Promise<Buffer>`.
 * The txid is byte-reversed from big-endian (display order, as stored in
 * BitcoinOutput.hash) to little-endian (internal order, as required by
 * buildTransaction / lib.rs:274).
 */
async function mapTransparentInputs(
  account: ZcashAccount,
  tx: ZcashTransaction,
): Promise<TransparentInputJs[]> {
  const utxos: BitcoinOutput[] = resolveTransparentUtxos(account, tx);
  if (utxos.length === 0) return [];

  const walletAccount = getWalletAccount(account);
  const { xpub, crypto } = walletAccount.xpub;

  const [receiveAddrs, changeAddrs] = await Promise.all([
    walletAccount.xpub.getAccountAddresses(0),
    walletAccount.xpub.getAccountAddresses(1),
  ]);

  const addrMap = new Map<string, { account: number; index: number }>();
  for (const addr of [...receiveAddrs, ...changeAddrs]) {
    addrMap.set(addr.address, { account: addr.account, index: addr.index });
  }

  return Promise.all(
    utxos.map(async utxo => {
      const address = utxo.address;
      if (address === null || address === undefined || address === "") {
        // Fail-closed: a UTXO with no address cannot be mapped to a signing key.
        // The txid/vout are on-chain public data (safe for support logs); no
        // address is leaked because there is none.
        throw new ZcashUtxoNotInAccount(
          "Can't sign this transaction: one of your Zcash coins is missing address data. Please re-sync your account and try again.",
          { txid: utxo.hash, vout: utxo.outputIndex },
        );
      }
      const derivInfo = addrMap.get(address);
      if (!derivInfo) {
        // The UTXO's address is outside the synced receive/change set (gap-limit
        // bounded — see getAccountAddresses(0)/(1)), e.g. an out-of-gap-limit or
        // stale-sync coin. Fail-closed with account-scoped guidance rather than
        // leaking the raw address in the message; keep txid/vout for support.
        throw new ZcashUtxoNotInAccount(
          "Can't sign this transaction: one of your Zcash coins isn't recognized by this account yet. Please re-sync your account and try again.",
          { txid: utxo.hash, vout: utxo.outputIndex },
        );
      }
      const pubkeyBuf = await crypto.getPubkeyAt(xpub, derivInfo.account, derivInfo.index);
      const scriptPubKey = crypto.toOutputScript(address);
      return {
        // Reverse BE→LE: BitcoinOutput.hash is display (big-endian) order;
        // TransparentInputJs.txid requires internal (little-endian) byte order.
        txid: Buffer.from(utxo.hash, "hex").reverse().toString("hex"),
        vout: utxo.outputIndex,
        scriptPubKey: scriptPubKey.toString("hex"),
        valueZat: utxo.value.toFixed(0),
        pubkey: pubkeyBuf.toString("hex"),
        derivationScope: derivInfo.account, // 0 = external, 1 = change
        addressIndex: derivInfo.index,
      };
    }),
  );
}

function mapOutputs(tx: ZcashTransaction): OutputRequestJs[] {
  return [
    {
      address: tx.recipient,
      valueZat: tx.amount.toFixed(0),
      ...(tx.memo !== undefined && { memo: tx.memo }),
    },
  ];
  // Note: change output is computed internally by buildTransaction (ZIP-317).
}

// Marker written to the signed operation's `extra` so the adapter's broadcast
// override can recognise a shielded PCZT operation and submit it over gRPC.
// Transparent Zcash operations (legacy Bitcoin path) don't carry it and fall
// through to the standard explorer broadcast.
//
// Public→* flows also spend transparent UTXOs, so the extra additionally carries
// the standard Bitcoin `inputs`/`inputRefs` metadata (BtcOperationExtra) — this
// keeps the broadcast() double-spend guard and pending-spent/conflict-dedup
// consumers working for those UTXOs even though the V5 tx broadcasts over gRPC.
type ZcashOperationExtra = BtcOperationExtra & { zcashShielded?: boolean };

const isShieldedOperation = (extra: unknown): boolean =>
  !!extra && typeof extra === "object" && (extra as ZcashOperationExtra).zcashShielded === true;

/**
 * Builds the `inputs`/`inputRefs` metadata for the transparent UTXOs spent by a
 * Public→* flow. Empty for pure shielded flows (Orchard-note inputs only).
 */
function buildTransparentInputExtra(
  account: ZcashAccount,
  tx: ZcashTransaction,
): Pick<BtcOperationExtra, "inputs" | "inputRefs"> {
  const inputRefs: BtcInputRef[] = resolveTransparentUtxos(account, tx).flatMap(utxo =>
    utxo.address !== null && utxo.address !== undefined && utxo.address !== ""
      ? [{ hash: utxo.hash, outputIndex: utxo.outputIndex, address: utxo.address }]
      : [],
  );
  if (inputRefs.length === 0) return {};
  return { inputs: inputRefs.map(r => `${r.hash}-${r.outputIndex}`), inputRefs };
}

/**
 * Builds an optimistic SignedOperation for the Zcash PCZT flow.
 * The hash is the txid returned by finalizeTransaction (big-endian display order).
 * The transaction is NOT broadcast here — the adapter's broadcast override
 * submits the signed V5 tx over gRPC during the standard broadcast step.
 */
function buildSignedOperation(
  account: ZcashAccount,
  tx: ZcashTransaction,
  txid: string,
  feeZat: string,
  txHex: string,
): SignedOperation {
  const fee = new BigNumber(feeZat);
  const operation: Operation = {
    id: encodeOperationId(account.id, txid, "OUT"),
    hash: txid,
    type: "OUT",
    value: tx.amount.plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [tx.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {
      zcashShielded: true,
      ...buildTransparentInputExtra(account, tx),
    } satisfies ZcashOperationExtra,
  };
  return { operation, signature: txHex };
}

// ── DMK transport helpers ─────────────────────────────────────────────────

type DmkTransport = {
  dmk: ConstructorParameters<typeof DmkSignerZcash>[0];
  sessionId: string;
};

const isDmkTransport = (transport: unknown): transport is DmkTransport =>
  !!transport &&
  typeof transport === "object" &&
  "dmk" in transport &&
  "sessionId" in transport &&
  typeof (transport as { sessionId: unknown }).sessionId === "string";

type ZcashLikeSigner = {
  getAddress: (path: string, display?: boolean) => Promise<ZcashAddress>;
  getFullViewingKey: (path: string) => Promise<ZcashViewKey>;
};

const isZcashSigner = (signer: unknown): signer is ZcashLikeSigner =>
  !!signer && typeof signer === "object";

// Recipient classification for shielded branches. Both shielded flows
// ("shielded" and "shielded-to-transparent") require a recipient, so an empty
// address must surface a RecipientRequired error — otherwise the send flow
// considers the recipient step valid and lets the user proceed.
const computeRecipientError = (recipient: string, currencyName: string): Error | undefined => {
  if (!recipient) return new RecipientRequired("");
  const cls = classifyZcashRecipient(recipient);
  if (!("error" in cls)) return undefined;
  return cls.error === "sapling-unsupported"
    ? new ZcashSaplingRecipientNotSupported()
    : new InvalidAddress("", { currencyName });
};

const computeAmountError = (
  tx: ZcashTransaction,
  totalSpent: BigNumber,
  orchardBalance: BigNumber,
): Error | undefined => {
  if (tx.amount.lte(0) && !tx.useAllAmount) return new Error("Amount must be positive");
  if (!tx.selectedNotes || tx.selectedNotes.length === 0)
    return new Error("Insufficient shielded balance");
  if (totalSpent.gt(orchardBalance)) return new Error("Insufficient shielded balance");
  // Verify selected notes actually cover the spend (consistency check)
  const selectedTotal = tx.selectedNotes.reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
  if (selectedTotal.lt(totalSpent)) return new Error("Selected notes do not cover amount + fee");
  return undefined;
};

const hasGetAddressFunction = (signer: unknown): signer is ZcashLikeSigner =>
  isZcashSigner(signer) && "getAddress" in signer && typeof signer.getAddress === "function";

const hasGetFullViewingKeyFunction = (signer: unknown): signer is ZcashLikeSigner =>
  isZcashSigner(signer) &&
  "getFullViewingKey" in signer &&
  typeof signer.getFullViewingKey === "function";

// Bitcoin-specific status fields — never applicable to shielded/PCZT flows.
const bitcoinStatusExtras: Pick<
  TransactionStatus,
  "txInputs" | "txOutputs" | "opReturnData" | "changeAddress"
> = {
  txInputs: undefined,
  txOutputs: undefined,
  opReturnData: undefined,
  changeAddress: undefined,
};

/**
 * Computes the transaction status for a transparent-input (Public→*) send:
 * Public→Private ("transparent-to-shielded", Orchard output) and, with the
 * zcashShielded flag on, Public→Public ("transparent", transparent output).
 *
 * Inputs are transparent UTXOs (validated against the transparent balance). The
 * recipient class differs per flow (u1 for →shielded, t1/t3 for →transparent)
 * but both are accepted by `computeRecipientError`. The fee is the ZIP-317 fee
 * produced by prepareTransaction; an unprepared tx falls back to the minimum so
 * the status still renders.
 */
function getTransparentInputStatus(
  account: ZcashAccount,
  tx: ZcashTransaction,
  currencyName: string,
): Promise<TransactionStatus> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const transparentBalance = resolveTransparentUtxos(account, tx).reduce(
    (sum, utxo) => sum.plus(utxo.value),
    new BigNumber(0),
  );

  const fee = tx.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
  const totalSpent = tx.amount.plus(fee);

  const recipientError = computeRecipientError(tx.recipient, currencyName);
  if (recipientError) errors.recipient = recipientError;

  if (tx.amount.lte(0) && !tx.useAllAmount) {
    errors.amount = new Error("Amount must be positive");
  } else if (totalSpent.gt(transparentBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees: fee,
    amount: tx.amount,
    totalSpent,
    ...bitcoinStatusExtras,
  } satisfies TransactionStatus);
}

const zcashChainAdapter: ChainAdapter = {
  id: "zcash",

  // ── Sync ────────────────────────────────────────────────────────────

  buildExtraSyncObservable,

  computeAccountBalance(account: BitcoinAccount | undefined, transparentBalance: BigNumber) {
    // Flag OFF ⇒ every send falls back to the legacy transparent Bitcoin path,
    // so the shielded (Orchard/Sapling) pools are NOT spendable. Counting them in
    // the balance would make the account show more than the transparent max
    // spendable — the displayed balance and the send flow's "maximum estimated
    // amount" could never agree, and toggling "Send max" could not reach the
    // shown balance. Report the transparent balance only until the feature is on.
    if (!isZcashShieldedEnabled()) return transparentBalance;
    return computeZcashBalance(
      transparentBalance,
      (account as ZcashAccount | undefined)?.privateInfo,
    );
  },

  async resolveTransactionDetails(
    transactions: TX[],
    account: BitcoinAccount | undefined,
  ): Promise<ResolvedTransactions> {
    const asReported = { transactions, payeesByTxId: new Map<string, string[]>() };
    if (!isZcashShieldedEnabled()) return asReported;

    const { grpcUrl, network } = getZainoEndpoint();
    const { createZCashClient } = await getZCashModule();
    const client = createZCashClient({ grpcUrl, network });

    // Optional on ZCashClient: the React Native stub omits it. The capability is
    // settled for the whole platform, so it is asked about here rather than per
    // batch — nothing is left half-asked, and no sync builds a request nobody
    // can answer. The explorer's view stands, as it did before this hook.
    const transactionDetails = client.transactionDetails;
    if (!transactionDetails) return asReported;

    // Without the viewing key the fees are still recoverable; only the shielded
    // payees are not, since they are encrypted to it.
    const ufvk = (account as ZcashAccount | undefined)?.privateInfo?.ufvk ?? undefined;

    return resolveTransactionDetails(
      transactions,
      requests => transactionDetails(requests, ufvk),
      ufvk,
    );
  },

  assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
    const zcashAccount = account as ZcashAccount;
    if (zcashAccount.privateInfo) {
      (accountRaw as ZcashAccountRaw).privateInfo = toZcashPrivateInfoRaw(zcashAccount.privateInfo);
    }
  },

  assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
    const zcashPrivateInfoRaw = (accountRaw as ZcashAccountRaw).privateInfo;
    if (zcashPrivateInfoRaw) {
      (account as ZcashAccount).privateInfo = fromZcashPrivateInfoRaw(zcashPrivateInfoRaw);
    }
  },

  // ── Transaction ─────────────────────────────────────────────────────
  // Routing between the PCZT/V5 path (here) and the legacy Bitcoin PSBT path is
  // driven by the zcashShielded feature flag (isZcashShieldedEnabled), NOT by the
  // transfer type: flag ON ⇒ every send (including Public→Public "transparent")
  // is signed via PCZT here; flag OFF ⇒ every send returns undefined and falls
  // back to the legacy path.

  signOperation(
    account: Account,
    deviceId: string,
    transaction: Transaction,
    signerContext: SignerContext,
  ): Observable<SignOperationEvent> | undefined {
    // Routing is driven by the zcashShielded feature flag, NOT by the transfer
    // type: flag ON ⇒ every Zcash send (including Public→Public / transparent
    // t→t) is built and signed as a V5 PCZT here; flag OFF ⇒ fall through to the
    // legacy Bitcoin PSBT path for every send.
    //
    // Exception: shielded-input types ("shielded", "shielded-to-transparent")
    // spend Orchard notes and have NO transparent inputs. The legacy path cannot
    // represent note spends at all — it would emit a transparent-only transaction
    // with a wrong ZIP-244 txid and the network would reject it with "Missing
    // inputs". Fail immediately with a clear error rather than silently producing
    // an invalid transaction.
    if (!isZcashShieldedEnabled()) {
      if (isZcashTransaction(transaction)) {
        const { transferType } = transaction;
        if (
          transferType === "shielded" ||
          transferType === "shielded-to-transparent" ||
          transferType === "ironwood" ||
          transferType === "ironwood-to-transparent"
        ) {
          return new Observable(sub =>
            sub.error(
              new Error(
                `Zcash ${transferType} transactions require the zcashShielded feature to be enabled`,
              ),
            ),
          );
        }
      }
      return undefined;
    }

    // createTransaction() returns a base Bitcoin-family Transaction with no
    // Zcash-specific fields. Until the UI populates the Zcash shape (transferType
    // + the prepareTransaction-computed selectedNotes/zcashFee), the PCZT path
    // below would throw. Fall back to the legacy PSBT path so partial/legacy
    // flows aren't broken while the flag is enabled.
    if (!isZcashTransaction(transaction)) return undefined;

    // Ironwood signing is not yet available — finalizeIronwoodTransaction has not
    // shipped in @ledgerhq/zcash-utils. Reject immediately with a clear message so
    // the UI surfaces a user-visible error rather than hanging during proving.
    if (
      transaction.transferType === "ironwood" ||
      transaction.transferType === "ironwood-to-transparent"
    ) {
      return new Observable(sub =>
        sub.error(
          new Error(
            `Zcash ${transaction.transferType} signing is not yet supported — requires finalizeIronwoodTransaction`,
          ),
        ),
      );
    }

    const zcashAccount = account as ZcashAccount;
    const tx = transaction;

    return new Observable<SignOperationEvent>(subscriber => {
      let cancelled = false;
      const abort = (): void => {
        cancelled = true;
      };

      // Cooperative cancellation between steps. The in-flight await (Halo2
      // proving, device signing, finalize) can't be interrupted, so this only
      // stops the flow *before the next step*, discarding the in-flight result.
      // If the subscription is cancelled (unsubscribed) while an async step is in-flight,
      // we stop the orchestration after the current await resolves and do not proceed
      // to subsequent steps (device signing / finalize / signed event).
      // No cancellation error is emitted because the subscriber is already closed on unsubscribe.
      const bailIfCancelled = (): boolean => {
        if (!cancelled) return false;
        if (!subscriber.closed) subscriber.error(new ZcashSigningCancelled());
        return true;
      };

      (async () => {
        const ufvk = zcashAccount.privateInfo?.ufvk;
        if (!ufvk) throw new Error("Missing UFVK — account not yet synced");
        if (!tx.selectedNotes)
          throw new Error("Missing selectedNotes — run prepareTransaction first");
        if (tx.zcashFee === undefined)
          throw new Error("Missing zcashFee — run prepareTransaction first");

        // ── Step 1: resolve the ZCash client via lazy module import ──────────
        // Resolve the endpoint once so build, finalize and broadcast all target
        // the same URL/network — and honour any setZainoGrpcUrl override (the
        // shielded sync path uses the same resolver).
        const { grpcUrl, network } = getZainoEndpoint();
        const { createZCashClient } = await getZCashModule();
        const client = createZCashClient({ grpcUrl, network });

        // The transaction-building methods are optional on ZCashClient: the
        // React Native stub omits them entirely. Fail with a clear message
        // rather than a cryptic "client.buildTransaction is not a function"
        // TypeError if a client without shielded-signing support is resolved.
        if (
          !client.buildTransaction ||
          !client.finalizeTransaction ||
          !client.broadcastTransaction
        ) {
          throw new Error("Shielded Zcash transactions are not supported in this environment");
        }

        if (bailIfCancelled()) return;

        // ── Step 2: resolve the ZIP-32 account index ─────────────────────────
        // freshAddressPath is an address-level path (".../0/<addressIndex>") and
        // does not carry the hardened account index. The wallet-btc account keeps
        // the ZIP-32 account index as a plain number in params.index.
        const accountIndex = getWalletAccount(zcashAccount).params.index;

        // ── Step 3: map inputs/outputs ───────────────────────────────────────
        const transparentInputs = await mapTransparentInputs(zcashAccount, tx);
        if (bailIfCancelled()) return;

        // ── Step 4: build PCZT (Halo 2 proving + parsePczt in UtilityProcess) ─
        const buildResult = await client.buildTransaction!({
          grpcUrl,
          ufvk,
          network,
          // Placeholder all-zero 32-byte ZIP-32 seed fingerprint. The Zcash
          // device app only *logs* this field: in app-zcash the PCZT parser
          // binds it to an intentionally-unused `_seed_fingerprint`
          // (parser/pczt/transparent.rs) / emits it via `debug!`
          // (parser/pczt/orchard.rs finish_orchard_zip32_derivation) and
          // validates the derivation *path* (check_bip44_compliance), not the
          // fingerprint. Safe today, but if the app ever starts validating it,
          // every PCZT built here would be rejected on-device with no
          // compile-time signal.
          // TODO(zcash): supply the real ZIP-32 seed fingerprint.
          seedFingerprint: "00".repeat(32),
          accountIndex,
          // zcashFee and selectedNotes are validated before the Observable is
          // constructed — non-null assertions are safe here.
          feeZat: tx.zcashFee!.toFixed(0),
          spends: mapSpends(tx.selectedNotes!),
          transparentInputs,
          outputs: mapOutputs(tx),
        });

        if (bailIfCancelled()) return;

        // ── Step 5: device signing via signerContext ──────────────────────────
        // The signer is augmented with signPcztTransaction in createSigner().
        // Emitted here, immediately before device interaction, so the UI does not
        // prompt "confirm on device" while the CPU-bound PCZT build is still running.
        subscriber.next({ type: "device-signature-requested" });
        const sigResult = await signerContext(
          deviceId,
          account.currency,
          async (signer: BitcoinSigner) => {
            const zcashSigner = signer as unknown as {
              signPcztTransaction?: (pczt: PcztTransaction) => Promise<SignPcztTransactionResult>;
            };
            if (typeof zcashSigner.signPcztTransaction !== "function") {
              throw new ZcashSignerNotSupported(
                "ZCash signing requires a signer augmented with signPcztTransaction (see createSigner); the provided signerContext returned an incompatible signer",
              );
            }
            return zcashSigner.signPcztTransaction(buildResult.pcztTransaction);
          },
        );

        subscriber.next({ type: "device-signature-granted" });
        if (bailIfCancelled()) return;

        // ── Step 6: finalize (inject signatures → signed V5 tx) ──────────────
        // finalizeTransaction strips the sighash_type byte from transparent sigs
        // internally (parse_transparent_der in finalize.rs). Pass as-is.
        const orchardSignatures = sigResult.orchard.map(a =>
          Buffer.from(a.spendAuthSig).toString("hex"),
        );
        const transparentSignatures = sigResult.transparentInputSigs.map(sig =>
          Buffer.from(sig).toString("hex"),
        );

        const finalizeResult = await client.finalizeTransaction!({
          pczt: buildResult.pcztHex,
          orchardSignatures,
          transparentSignatures,
        });

        if (bailIfCancelled()) return;

        // ── Step 7: emit signed event ────────────────────────────────────────
        // Broadcasting is intentionally NOT done here. The signed V5 tx is
        // submitted over gRPC by the adapter's broadcast override during the
        // standard signOperation() → broadcast() flow, mirroring the Bitcoin
        // bridge and avoiding a double-broadcast (the transparent explorer
        // path cannot submit a shielded V5 tx anyway).
        const signedOperation = buildSignedOperation(
          zcashAccount,
          tx,
          finalizeResult.txid,
          buildResult.feeZat,
          finalizeResult.txHex,
        );
        subscriber.next({ type: "signed", signedOperation });
        subscriber.complete();
      })().catch(err => subscriber.error(err));

      return abort;
    });
  },

  broadcast(_account: Account, signedOperation: SignedOperation): Promise<Operation> | undefined {
    // Only shielded PCZT operations are broadcast here (via gRPC). Transparent
    // Zcash operations carry no marker and fall through to the standard Bitcoin
    // explorer broadcast.
    if (!isShieldedOperation(signedOperation.operation.extra)) return undefined;

    return (async () => {
      // Resolve the endpoint the same way signOperation did, honouring any
      // setZainoGrpcUrl override.
      const { grpcUrl, network } = getZainoEndpoint();
      const { createZCashClient } = await getZCashModule();
      const client = createZCashClient({ grpcUrl, network });

      if (!client.broadcastTransaction) {
        throw new Error("Shielded Zcash transactions are not supported in this environment");
      }

      // signedOperation.signature is the finalized V5 tx hex from signOperation.
      const txid = await client.broadcastTransaction(grpcUrl, signedOperation.signature);
      return patchOperationWithHash(signedOperation.operation, txid);
    })();
  },

  getTransactionStatus(account: Account, transaction: Transaction) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction;

    // Flag OFF ⇒ legacy Bitcoin validation for every Zcash send.
    if (!isZcashShieldedEnabled()) return undefined;

    // Transparent-input flows (Public→*): status is computed from the transparent
    // balance and the ZIP-317 fee (NOT Orchard note selection). Covers
    // Public→Private ("transparent-to-shielded") and, with the flag on,
    // Public→Public ("transparent").
    if (isTransparentInputTransfer(tx.transferType)) {
      return getTransparentInputStatus(zcashAccount, tx, account.currency.name);
    }

    // Remaining flows with shielded inputs: Orchard ("shielded",
    // "shielded-to-transparent") and Ironwood ("ironwood", "ironwood-to-transparent").
    if (
      tx.transferType !== "shielded" &&
      tx.transferType !== "shielded-to-transparent" &&
      tx.transferType !== "ironwood" &&
      tx.transferType !== "ironwood-to-transparent"
    )
      return undefined;

    const errors: Record<string, Error> = {};
    const warnings: Record<string, Error> = {};

    const privateInfo = zcashAccount.privateInfo;
    if (!privateInfo) {
      errors.account = new Error("Shielded sync not complete");
      return Promise.resolve({
        errors,
        warnings,
        estimatedFees: new BigNumber(0),
        amount: tx.amount,
        totalSpent: tx.amount,
        ...bitcoinStatusExtras,
      } satisfies TransactionStatus);
    }

    // Validate against the pool balance that will be spent.
    const poolBalance =
      tx.transferType === "ironwood" || tx.transferType === "ironwood-to-transparent"
        ? privateInfo.ironwoodBalance
        : privateInfo.orchardBalance;
    const fee = tx.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
    const totalSpent = tx.amount.plus(fee);

    const recipientError = computeRecipientError(tx.recipient, account.currency.name);
    if (recipientError) errors.recipient = recipientError;

    const amountError = computeAmountError(tx, totalSpent, poolBalance);
    if (amountError) errors.amount = amountError;

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees: fee,
      amount: tx.amount,
      totalSpent,
      ...bitcoinStatusExtras,
    } satisfies TransactionStatus);
  },

  estimateMaxSpendable(
    account: Account,
    _parentAccount: Account | null | undefined,
    transaction: Transaction | null | undefined,
  ) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction | null | undefined;

    // Flag OFF ⇒ legacy Bitcoin estimation for every Zcash send.
    if (!isZcashShieldedEnabled()) return undefined;

    // Transparent-input flows (Public→*): max spendable is the transparent UTXO
    // balance minus the ZIP-317 fee. Handled here so a →shielded send never
    // reaches the legacy Bitcoin estimator (which would call toOutputScript on a
    // u1 recipient and throw).
    if (tx && isTransparentInputTransfer(tx.transferType)) {
      const utxoValues = resolveTransparentUtxos(zcashAccount, tx).map(utxo => utxo.value);
      return Promise.resolve(estimateMaxSpendableTransparent(utxoValues, tx.transferType));
    }

    const transferType = tx?.transferType ?? "transparent";
    // Max spendable from note-based pools (Orchard or Ironwood).
    if (
      transferType !== "shielded" &&
      transferType !== "shielded-to-transparent" &&
      transferType !== "ironwood" &&
      transferType !== "ironwood-to-transparent"
    )
      return undefined;

    const notes =
      transferType === "ironwood" || transferType === "ironwood-to-transparent"
        ? collectIronwoodSpendableNotes(zcashAccount.privateInfo?.transactions ?? [])
        : collectSpendableNotes(zcashAccount.privateInfo?.transactions ?? []);
    return Promise.resolve(estimateMaxSpendableAmount(notes, transferType));
  },

  prepareTransaction(account: Account, transaction: Transaction) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction;

    // Flag OFF ⇒ legacy Bitcoin preparation for every Zcash send.
    if (!isZcashShieldedEnabled()) return undefined;

    // Transparent-input flows (Public→*): spend transparent UTXOs. There is no
    // Orchard note selection — only ZIP-317 fee/change resolution over the
    // transparent inputs. signOperation then builds the PCZT with
    // `selectedNotes: []` (no Orchard spends) and these transparent inputs.
    // Covers Public→Private ("transparent-to-shielded", Orchard output) and,
    // with the flag on, Public→Public ("transparent", transparent output).
    if (isTransparentInputTransfer(tx.transferType)) {
      return Promise.resolve(prepareTransparentTransaction(zcashAccount, tx));
    }

    // Note-selection flows: Ironwood ("ironwood" / "ironwood-to-transparent") and
    // Orchard-shielded ("shielded" / "shielded-to-transparent"). Both run the same
    // pipeline; only the collected note set differs.
    const transactions = zcashAccount.privateInfo?.transactions ?? [];
    if (IRONWOOD_TRANSFER_TYPES.has(tx.transferType)) {
      return Promise.resolve(
        prepareNoteTransaction(collectIronwoodSpendableNotes(transactions), tx),
      );
    }
    if (SHIELDED_TRANSFER_TYPES.has(tx.transferType)) {
      return Promise.resolve(prepareNoteTransaction(collectSpendableNotes(transactions), tx));
    }

    // Any other transfer type ⇒ legacy Bitcoin preparation.
    return undefined;
  },

  /**
   * Prices the legacy transparent path — the one every Zcash send takes while the
   * shielded flag is off, and the only one that goes through wallet-btc's
   * sat/vByte fee. The PCZT flows above compute their ZIP-317 fee directly in
   * prepareTransaction and never consult a rate.
   */
  resolveFeePerByte(account: Account, transaction: Transaction) {
    if (isZcashShieldedEnabled()) return undefined;
    // The prepared rate covers ZIP-317 for any layout (see zcashSafeFeePerByte);
    // it is the starting point and the fallback of the resolution.
    const safeFeePerByte = transaction.feePerByte;
    if (!safeFeePerByte || safeFeePerByte.lte(0)) return undefined;
    return resolveZcashFeePerByte(account, transaction, safeFeePerByte);
  },

  getAddress(deviceId, { currency, path, verify }, signerContext: SignerContext) {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetAddressFunction(signer)) {
        throw new Error("Zcash signer must implement getAddress(path, display?)");
      }
      const { address, publicKey, chainCode } = await signer.getAddress(path, verify || false);
      return {
        bitcoinAddress: address,
        publicKey,
        chainCode,
      } satisfies BitcoinAddress;
    });
  },

  getWalletXpub(
    deviceId,
    { currency, accountPath, xpubVersion },
    signerContext: SignerContext,
  ): Promise<BitcoinXPub> {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetAddressFunction(signer)) {
        throw new Error("Zcash signer must implement getAddress(path, display?)");
      }

      // The DMK Zcash signer-kit only exposes `getAddress`. Replicate the
      // legacy `BtcOld.getWalletXpub` flow: fetch both the account-level key
      // (for chaincode + pubkey) and the parent key (for the fingerprint),
      // then BIP32-serialize them locally.
      const accountPathElements = pathStringToArray(accountPath);
      if (accountPathElements.length === 0) {
        throw new Error(`Cannot derive xpub from empty path "${accountPath}"`);
      }
      const parentPath = accountPath.split("/").slice(0, -1).join("/");
      const childNumber = accountPathElements[accountPathElements.length - 1];

      const parent = await signer.getAddress(parentPath, false);
      const account = await signer.getAddress(accountPath, false);

      return composeXpub({
        xpubVersion,
        depth: accountPathElements.length,
        childNumber,
        parentPublicKeyHex: parent.publicKey,
        accountPublicKeyHex: account.publicKey,
        accountChainCodeHex: account.chainCode,
      });
    });
  },

  getFullViewingKey(deviceId, currency, path, signerContext: SignerContext) {
    return signerContext(deviceId, currency, async signer => {
      if (!hasGetFullViewingKeyFunction(signer)) {
        throw new Error("Zcash signer must implement getFullViewingKey(path)");
      }
      const { viewKey } = await signer.getFullViewingKey(path);
      return viewKey;
    });
  },

  createSigner(transport, _currency, defaultSigner) {
    if (!isDmkTransport(transport)) return undefined;

    // Augment the default BitcoinSigner with DmkSignerZcash methods.
    // This gives chain adapter overrides (getAddress, getWalletXpub, getFullViewingKey)
    // access to the DMK signer. Transparent signing also routes through the DMK
    // signer via createPaymentTransaction; the remaining BitcoinSigner methods
    // (e.g. splitTransaction) continue to come from Btc.
    const dmk = new DmkSignerZcash(transport.dmk, transport.sessionId);

    // Wrap splitTransaction to carry the original raw hex on the returned
    // object. wallet.signAccountTx discards i.txHex after calling splitTransaction
    // and only forwards the parsed structure to createPaymentTransaction.
    // Without the raw bytes, DmkSignerZcash cannot populate
    // serializedPreviousTransactionOverride, so the device receives a truncated
    // transaction (Orchard bundle stripped by serializeTransaction) and computes
    // a wrong ZIP-244 txid — causing "Missing inputs" on broadcast.
    const baseSplitTransaction = defaultSigner.splitTransaction.bind(defaultSigner);

    return Object.assign(defaultSigner, {
      splitTransaction: (
        transactionHex: string,
        isSegwitSupported: boolean | null | undefined,
        hasExtraData: boolean | null | undefined,
        additionals: Array<string> | null | undefined,
      ) => {
        const result = baseSplitTransaction(
          transactionHex,
          isSegwitSupported,
          hasExtraData,
          additionals,
        );
        return { ...result, rawTxHex: transactionHex };
      },
      getAddress: dmk.getAddress.bind(dmk),
      getFullViewingKey: dmk.getFullViewingKey.bind(dmk),
      createPaymentTransaction: dmk.createPaymentTransaction.bind(dmk),
      signPcztTransaction: dmk.signPcztTransaction.bind(dmk),
    });
  },
};

registerChainAdapter(zcashChainAdapter);
