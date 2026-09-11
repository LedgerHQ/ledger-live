import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { computeDustAmount } from "@ledgerhq/wallet-btc/utils";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import type { BitcoinContext } from "../api/config";
import { DustLimit } from "../errors";
import { deriveAccountMeta } from "./buildAccount";
import { validateAddress } from "./validateAddress";

// Fees are flagged "too high" once they exceed 1/RATIO of the sent amount (i.e. 10%), matching the
// coin-kaspa / coin-cardano threshold.
const FEE_TOO_HIGH_RATIO = 10n;

function spendableNative(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  return (native?.value ?? 0n) - (native?.locked ?? 0n);
}

/**
 * Validate a native Bitcoin(-like) send intent over the Alpaca surface — stateless, mirroring the
 * coin-kaspa template (the established UTXO `validateIntent`), adapted to Bitcoin's multi-format
 * addresses:
 *
 * - recipient present and a well-formed address for `currencyId` (Legacy / SegWit / Native SegWit /
 *   Taproot, via the module's own {@link validateAddress});
 * - recipient is not the sender (the xpub carried in `intent.sender`);
 * - a positive amount (or `useAllAmount`), and enough spendable balance to cover amount + fees;
 * - a fee-too-high warning.
 *
 * Fees come from the framework via `customFees` (it calls `estimateFees` first); the `0n` fallback is
 * display-only.
 *
 * Dust: the send amount is checked against the network dust threshold via the same
 * `computeDustAmount` model as the legacy `getTransactionStatus.ts`, keyed on the script type from
 * `senderDerivationPath`. Being stateless (no crafted tx, no live network info) it uses the 1 sat/vB
 * minimum relay fee — a live relay fee only raises the threshold, so this never over-rejects. The
 * check is skipped when the derivation path is absent (script type unknown).
 */
export async function validateIntent(
  _context: BitcoinContext,
  currencyId: string,
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const available = spendableNative(balances);

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (intent.recipient === intent.sender) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!(await validateAddress(intent.recipient, { currencyId }))) {
    errors.recipient = new InvalidAddress("", {
      currencyName: getCryptoCurrencyById(currencyId).name,
    });
  }

  const spendableForAmount = available - estimatedFees;
  const maxAmount = spendableForAmount > 0n ? spendableForAmount : 0n;
  const amount = intent.useAllAmount ? maxAmount : intent.amount;

  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (amount + estimatedFees > available) {
    errors.amount = new NotEnoughBalance();
  }

  // Dust: reject an output too small to be economically spendable. Only meaningful once the amount is
  // otherwise valid and the script type is known (from the derivation path).
  if (!errors.amount && amount > 0n && intent.senderDerivationPath) {
    const { derivationMode } = deriveAccountMeta(intent.senderDerivationPath);
    const crypto = cryptoFactory(currencyId as unknown as Currency);
    // txSize is unused by the sat/vB core-dust model (Bitcoin & forks); it only feeds the legacy
    // per-size fallback, which we intentionally floor to 0 so the relay-fee model is authoritative.
    const dustAmount = computeDustAmount(crypto, 0, {
      derivationMode,
      relayFeePerByteSatVb: new BigNumber(1),
    });
    if (amount < BigInt(Math.ceil(dustAmount))) {
      errors.dustLimit = new DustLimit();
    }
  }

  if (amount > 0n && estimatedFees * FEE_TOO_HIGH_RATIO > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent: amount + estimatedFees,
  };
}
