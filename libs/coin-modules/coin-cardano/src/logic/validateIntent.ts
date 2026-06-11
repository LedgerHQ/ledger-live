import type {
  AssetInfo,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  StringMemo,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { CARDANO_MAX_SUPPLY } from "../constants";
import { CardanoMemoExceededSizeError, CardanoMinAmountError } from "../errors";
import { isTestnet, isValidAddress } from "../logic";
import { validateMemo } from "./validateMemo";

type Intent = TransactionIntent<StringMemo | MemoNotSupported>;

// Fees are flagged "too high" once they exceed 1/RATIO of the sent amount (i.e. 10%).
const FEE_TOO_HIGH_RATIO = 10n;

/**
 * Validate a transfer intent (native ADA or a native token) and compute its amount / total
 * spent. Fees come from the framework via customFees (it calls estimateFees first); the 0n
 * fallback is display-only, as a non-zero fee (minFeeB) is always charged on-chain.
 *
 * A native output must clear the Babbage min-UTXO floor (per-output (160 + |serialized_output|) ×
 * coinsPerUTxOByte, CIP-55); that needs coinsPerUTxOByte, so this fetches network info — the one place
 * validateIntent hits the network. Craft re-checks it (calculateMinUtxoAmountBabbage) as a backstop.
 */
export async function validateIntent(
  currency: CryptoCurrency,
  intent: Intent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = intent.asset.type !== "native";

  validateRecipient(currency, intent, errors);
  validateMemoSize(intent, errors);

  const amount = computeAmount(intent, balances, estimatedFees, isTokenTransfer);
  validateAmount(intent, amount, balances, estimatedFees, isTokenTransfer, errors);

  // A native output must clear the Babbage min-UTXO floor. Legacy precedence: this outranks
  // NotEnoughBalance (so it overrides) but not AmountRequired (hence the amount > 0n guard).
  // Best-effort: a network blip fetching params must not fail validation — craft re-checks the floor.
  if (!isTokenTransfer && !errors.recipient && amount > 0n) {
    const minAda = await computeMinUtxo(currency, intent.recipient).catch(() => undefined);
    if (minAda && new BigNumber(amount.toString()).lt(minAda)) {
      errors.amount = new CardanoMinAmountError("", { amount: minAda.div(1e6).toString() });
    }
  }

  // feeTooHigh compares the ADA fee to the ADA amount sent, so it only makes sense for native
  // transfers; a token `amount` is in token base units and is not comparable to a lovelace fee.
  if (!isTokenTransfer) {
    checkFeeTooHigh(amount, estimatedFees, warnings);
  }

  // Token transfers spend tokens for `amount` and ADA only for fees; native transfers spend
  // ADA for both, so fees fold into totalSpent.
  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

function validateRecipient(
  currency: CryptoCurrency,
  intent: Intent,
  errors: Record<string, Error>,
): void {
  // Shelley addresses embed a network tag in the header byte (CIP-19): testnet = 0, mainnet = 1.
  const networkId = isTestnet(currency) ? 0 : 1;
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isValidAddress(intent.recipient, networkId)) {
    errors.recipient = new InvalidAddress("", { currencyName: currency.name });
  }
}

// Babbage min-UTXO for a plain ADA output to `recipient`. CARDANO_MAX_SUPPLY is a worst-case amount so
// the serialized-size estimate (and thus the floor) is an upper bound; mirrors legacy getTransactionStatus.
async function computeMinUtxo(currency: CryptoCurrency, recipient: string): Promise<BigNumber> {
  const { protocolParams } = await fetchNetworkInfo(currency);
  return TyphonUtils.calculateMinUtxoAmountBabbage(
    {
      address: TyphonUtils.getAddressFromString(recipient),
      amount: new BigNumber(CARDANO_MAX_SUPPLY),
      tokens: [],
    },
    new BigNumber(protocolParams.utxoCostPerByte),
  );
}

function validateMemoSize(intent: Intent, errors: Record<string, Error>): void {
  const memo = "memo" in intent && intent.memo?.type === "string" ? intent.memo.value : undefined;
  if (!validateMemo(memo)) {
    errors.transaction = new CardanoMemoExceededSizeError();
  }
}

function spendableNative(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  return (native?.value ?? 0n) - (native?.locked ?? 0n);
}

function tokenBalance(asset: AssetInfo, balances: Balance[]): bigint {
  const reference = "assetReference" in asset ? asset.assetReference : undefined;
  const match = balances.find(
    b =>
      b.asset.type !== "native" &&
      "assetReference" in b.asset &&
      b.asset.assetReference === reference,
  );
  return match?.value ?? 0n;
}

function computeAmount(
  intent: Intent,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
): bigint {
  if (!intent.useAllAmount) {
    return intent.amount;
  }
  if (isTokenTransfer) {
    return tokenBalance(intent.asset, balances);
  }
  const max = spendableNative(balances) - estimatedFees;
  return max > 0n ? max : 0n;
}

function validateAmount(
  intent: Intent,
  amount: bigint,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
  errors: Record<string, Error>,
): void {
  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
    return;
  }
  if (isTokenTransfer) {
    // A token output bundles its own min-ADA and fees are paid in ADA, so a token send needs both
    // enough tokens and enough native ADA — it can never be funded by the token balance alone.
    if (
      amount > tokenBalance(intent.asset, balances) ||
      estimatedFees > spendableNative(balances)
    ) {
      errors.amount = new NotEnoughBalance();
    }
  } else if (amount + estimatedFees > spendableNative(balances)) {
    errors.amount = new NotEnoughBalance();
  }
}

function checkFeeTooHigh(
  amount: bigint,
  estimatedFees: bigint,
  warnings: Record<string, Error>,
): void {
  if (amount > 0n && estimatedFees * FEE_TOO_HIGH_RATIO > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }
}
