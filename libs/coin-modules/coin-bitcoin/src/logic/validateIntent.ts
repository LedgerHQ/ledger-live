import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { findCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import type {
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import { OP_RETURN_DATA_SIZE_LIMIT } from "@ledgerhq/wallet-btc/crypto/base";
import { computeDustAmount } from "@ledgerhq/wallet-btc/utils";
import type { Explorer } from "../network/explorer";
import { DustLimit, FeeTooLow, OpReturnDataSizeLimit } from "../errors";
import { cryptoFor } from "./currency";
import {
  derivationModeOf,
  feeInputs,
  isCancel,
  opReturnBuffer,
  resolveIntent,
  shapeOf,
  type BitcoinIntent,
} from "./intent";
import { isValidAddress } from "./validateAddress";
import type { TxShape } from "./shape";

type ErrorMap = Record<string, Error>;

function validateRecipient(currencyId: string, recipient: string, errors: ErrorMap): void {
  if (!recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isValidAddress(recipient, currencyId)) {
    const currency = findCryptoCurrencyById(currencyId);
    errors.recipient = new InvalidAddress("", { currencyName: currency?.name ?? currencyId });
  }
}

async function sanctionedInputs(currencyId: string, shape: TxShape | undefined): Promise<string[]> {
  const currency = findCryptoCurrencyById(currencyId);
  if (!currency || !shape) return [];
  const addresses = [...new Set(shape.inputs.map(i => i.address))];
  const flags = await Promise.all(addresses.map(a => isAddressSanctioned(currency, a)));
  return addresses.filter((_, i) => flags[i]);
}

/**
 * Validates the transaction spending the intent's inputs. The balances are not read: what a UTXO
 * transaction can spend is the set of inputs the caller selected, not an account total.
 */
export async function validateIntent(
  explorer: Explorer,
  currencyId: string,
  intent: BitcoinIntent,
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: ErrorMap = {};
  const warnings: ErrorMap = {};
  const useAllAmount = !!intent.useAllAmount;

  validateRecipient(currencyId, intent.recipient, errors);

  const resolved = await resolveIntent(
    explorer,
    currencyId,
    intent,
    feeInputs(intent, customFees?.parameters),
  );
  const { feePerByte, rates } = resolved;

  let shape: TxShape | undefined;
  if (feePerByte.isZero()) {
    errors.feePerByte = new FeeRequired();
  } else if (rates.relay.gt(0) && feePerByte.lt(rates.relay)) {
    errors.feePerByte = new FeeTooLow();
  } else if (!errors.recipient) {
    try {
      shape = shapeOf(currencyId, intent, resolved);
    } catch (error) {
      const name = (error as Error)?.name;
      if (name === "NotEnoughBalance") errors.amount = error as Error;
      else if (name === "RbfBuildError") errors.replacement = error as Error;
      else throw error;
    }
  }

  const fee = shape?.fee ?? 0n;
  const changes = shape
    ? shape.outputs.filter(o => o.isChange).reduce((s, o) => s + o.value, 0n)
    : 0n;
  const totalSpent = shape ? shape.total - changes : 0n;
  const amount = useAllAmount ? (shape ? shape.amount : 0n) : intent.amount;

  if (!errors.amount && amount <= 0n && !isCancel(intent)) {
    errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  }

  if (amount > 0n && fee * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (shape && amount > 0n && feePerByte.gt(0)) {
    const txSize = Math.ceil(Number(fee) / feePerByte.toNumber());
    const dust = computeDustAmount(cryptoFor(currencyId), txSize, {
      derivationMode:
        resolved.data.derivationMode === undefined ? undefined : derivationModeOf(resolved.data),
      relayFeePerByteSatVb: rates.relay.gt(0) ? rates.relay : undefined,
    });
    if (new BigNumber(amount.toString()).lt(dust)) {
      errors.dustLimit = new DustLimit();
    }
  }

  const opReturn = opReturnBuffer(resolved.data);
  if (opReturn && opReturn.length > OP_RETURN_DATA_SIZE_LIMIT) {
    errors.opReturnSizeLimit = new OpReturnDataSizeLimit();
  }

  const sanctioned = await sanctionedInputs(currencyId, shape);
  if (sanctioned.length > 0) {
    errors.sender = new AddressesSanctionedError("AddressesSanctionedError", {
      addresses: sanctioned,
    });
  }

  return { errors, warnings, estimatedFees: fee, amount, totalSpent };
}
