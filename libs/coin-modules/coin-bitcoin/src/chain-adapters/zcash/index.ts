import { BigNumber } from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { ChainAdapter } from "../types";
import type { BitcoinAddress, BitcoinXPub, SignerContext } from "../../signer";
import type { Transaction, TransactionStatus } from "../../types";
import { DmkSignerZcash } from "@ledgerhq/live-signer-zcash";
import type { ZcashAddress, ZcashViewKey } from "@ledgerhq/live-signer-zcash";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw, ZcashTransaction } from "./types";
import { classifyZcashRecipient } from "./address";
import { ZcashSaplingRecipientNotSupported } from "../../errors";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";
import { collectSpendableNotes } from "./operations";
import { selectNotes, estimateMaxSpendableAmount, ZIP317_MINIMUM_FEE } from "./coin-selection";
import { composeXpub } from "./xpub";
import { computeZcashBalance } from "./balance";
import type { BitcoinAccount } from "../../types";

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

const zcashChainAdapter: ChainAdapter = {
  id: "zcash",

  // ── Sync ────────────────────────────────────────────────────────────

  buildExtraSyncObservable,

  computeAccountBalance(account: BitcoinAccount | undefined, transparentBalance: BigNumber) {
    return computeZcashBalance(
      transparentBalance,
      (account as ZcashAccount | undefined)?.privateInfo,
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
  // All Zcash transactions (transparent + shielded) will use PCZT.
  // Until PCZT is implemented, returning undefined falls back to Bitcoin legacy path.

  signOperation(
    _account: Account,
    _deviceId: string,
    _transaction: Transaction,
    _signerContext: SignerContext,
  ) {
    // TODO(zcash transparent-to-shielded): implement PCZT signing for all Zcash
    // transactions. Until then this returns undefined and only the legacy
    // transparent (t-address -> t-address) send actually completes; shielded and
    // transparent-to-shielded sends are blocked at signing even when recipient
    // validation and status pass.
    return undefined;
  },

  getTransactionStatus(account: Account, transaction: Transaction) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction;
    // Only handle flows with shielded inputs (Orchard note selection): "shielded"
    // (private -> private) and "shielded-to-transparent" (private -> public).
    //
    // "transparent" (public -> public, t-address recipient) legitimately uses the
    // Bitcoin legacy path. "transparent-to-shielded" (public -> shielded u1
    // recipient) ALSO falls through here, but the legacy path cannot encode a
    // shielded output — see the skip-legacy-fee workaround in
    // ../../getTransactionStatus.ts, which keeps recipient validation working while
    // the real send is unimplemented.
    //
    // TODO(zcash transparent-to-shielded): when PCZT building lands, add
    // "transparent-to-shielded" to this guard and compute its status here
    // (recipient already classified below; fees come from the PCZT builder, NOT
    // ZIP-317 Orchard note selection since the inputs are transparent UTXOs). Once
    // handled here, remove the skipLegacyFeeCalculation workaround in
    // ../../getTransactionStatus.ts.
    if (tx.transferType !== "shielded" && tx.transferType !== "shielded-to-transparent")
      return undefined;

    const errors: Record<string, Error> = {};
    const warnings: Record<string, Error> = {};

    // Bitcoin-specific fields — not applicable for shielded transactions
    const bitcoinExtras: Pick<
      TransactionStatus,
      "txInputs" | "txOutputs" | "opReturnData" | "changeAddress"
    > = {
      txInputs: undefined,
      txOutputs: undefined,
      opReturnData: undefined,
      changeAddress: undefined,
    };

    const privateInfo = zcashAccount.privateInfo;
    if (!privateInfo) {
      errors.account = new Error("Shielded sync not complete");
      return Promise.resolve({
        errors,
        warnings,
        estimatedFees: new BigNumber(0),
        amount: tx.amount,
        totalSpent: tx.amount,
        ...bitcoinExtras,
      } satisfies TransactionStatus);
    }

    const orchardBalance = privateInfo.orchardBalance;
    const fee = tx.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
    const totalSpent = tx.amount.plus(fee);

    const recipientError = computeRecipientError(tx.recipient, account.currency.name);
    if (recipientError) errors.recipient = recipientError;

    const amountError = computeAmountError(tx, totalSpent, orchardBalance);
    if (amountError) errors.amount = amountError;

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees: fee,
      amount: tx.amount,
      totalSpent,
      ...bitcoinExtras,
    } satisfies TransactionStatus);
  },

  estimateMaxSpendable(
    account: Account,
    _parentAccount: Account | null | undefined,
    transaction: Transaction | null | undefined,
  ) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction | null | undefined;
    const transferType = tx?.transferType ?? "transparent";
    // Max spendable from Orchard notes only applies to shielded-input flows.
    //
    // TODO(zcash transparent-to-shielded): "transparent" and
    // "transparent-to-shielded" fall back to the legacy Bitcoin
    // estimateMaxSpendable, which calls toOutputScript on the recipient. For a
    // shielded (u1) recipient that throws InvalidAddress (ZCash.toOutputScript only
    // supports t1/t3) — so "Send max" from a transparent balance to a u1 recipient
    // currently fails. When the transparent-to-shielded send is implemented, handle
    // it here (max spendable = transparent UTXO balance minus the PCZT fee) so it
    // never reaches the legacy estimator.
    if (transferType !== "shielded" && transferType !== "shielded-to-transparent") return undefined;

    const notes = collectSpendableNotes(zcashAccount.privateInfo?.transactions ?? []);
    return Promise.resolve(estimateMaxSpendableAmount(notes, transferType));
  },

  prepareTransaction(account: Account, transaction: Transaction) {
    const zcashAccount = account as ZcashAccount;
    const tx = transaction as ZcashTransaction;
    // Only handle flows with shielded inputs (Orchard note selection).
    //
    // TODO(zcash transparent-to-shielded): "transparent-to-shielded" currently
    // falls through to the legacy Bitcoin prepareTransaction. That spends
    // transparent UTXOs (correct for the inputs) but cannot build the shielded
    // output for a u1 recipient. When PCZT building lands, handle it here:
    // select transparent UTXOs and produce the PCZT with an Orchard output.
    if (tx.transferType !== "shielded" && tx.transferType !== "shielded-to-transparent")
      return undefined;

    const notes = collectSpendableNotes(zcashAccount.privateInfo?.transactions ?? []);

    // When useAllAmount is set, compute the effective amount from max spendable
    const effectiveAmount = tx.useAllAmount
      ? estimateMaxSpendableAmount(notes, tx.transferType)
      : tx.amount;

    if (effectiveAmount.lte(0)) {
      const { zcashFee: _, changeAmount: __, ...rest } = tx;
      return Promise.resolve({
        ...rest,
        amount: effectiveAmount,
        selectedNotes: [],
      } as ZcashTransaction);
    }

    const result = selectNotes(notes, effectiveAmount, tx.transferType);
    if (!result) {
      // Destructure to strip stale zcashFee/changeAmount from a prior prepare
      const { zcashFee: _, changeAmount: __, ...rest } = tx;
      return Promise.resolve({
        ...rest,
        amount: effectiveAmount,
        selectedNotes: [],
      } as ZcashTransaction);
    }

    return Promise.resolve({
      ...tx,
      amount: effectiveAmount,
      selectedNotes: result.selectedNotes,
      zcashFee: result.fee,
      changeAmount: result.changeAmount,
    } as ZcashTransaction);
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
    return Object.assign(defaultSigner, {
      getAddress: dmk.getAddress.bind(dmk),
      getFullViewingKey: dmk.getFullViewingKey.bind(dmk),
      createPaymentTransaction: dmk.createPaymentTransaction.bind(dmk),
    });
  },
};

registerChainAdapter(zcashChainAdapter);
