import type {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { validateAddress as isValidStacksAddress } from "../common-logic";
import type { StacksTxData } from "../types";

/** pox-5's `MAX_NUM_CYCLES` (`pox-5.clar:78`). Client-side check only -- the contract's own
 * `ERR_INVALID_NUM_CYCLES` guard is the ground truth, this just avoids a wasted-fee on-chain abort. */
const MAX_NUM_CYCLES = 96;

function spendable(balances: Balance[], isToken: boolean, assetReference?: string): bigint {
  // Case-insensitive: same reasoning as `buildUnsignedTx.ts`'s `resolveAmount` -- `getBalance`'s
  // SIP-010 entries are always lowercased (`fetchAllTokenBalances`'s own normalization,
  // network/api.ts), but `assetReference` here comes from `getAssetFromToken`
  // (families/stacks/bridge/api.ts), which passes `token.contractAddress` through verbatim, and a
  // Stacks address's canonical form is uppercase.
  const asset = balances.find(b => {
    const balanceAssetReference = "assetReference" in b.asset ? b.asset.assetReference : undefined;
    return isToken
      ? b.asset.type !== "native" &&
          balanceAssetReference?.toLowerCase() === assetReference?.toLowerCase()
      : b.asset.type === "native";
  });
  return (asset?.value ?? 0n) - (asset?.locked ?? 0n);
}

/** Caps a spendable amount at the fee reserved for the transaction, floored at 0. */
function maxSpendableAfterFees(available: bigint, estimatedFees: bigint): bigint {
  const remainder = available - estimatedFees;
  return remainder > 0n ? remainder : 0n;
}

function validateStaking(
  intent: StakingTransactionIntent<MemoNotSupported, StacksTxData>,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
): { amount: bigint; totalSpent: bigint } {
  const availableNative = spendable(balances, false);

  if (intent.mode === "undelegate") {
    // Locked amount is fixed by the prior `stake` call; only the (separately-paid) fee is checked.
    if (estimatedFees > availableNative) {
      errors.amount = new NotEnoughBalance();
    }
    return { amount: 0n, totalSpent: estimatedFees };
  }

  // buildUnsignedTx's delegate branch requires both, splitting valAddress on "." -- flag their
  // absence/shape here too, so a caller doesn't get a false "valid" result that throws at craft time.
  if (!intent.valAddress.includes(".")) {
    errors.valAddress = new Error(
      "valAddress must be a contract principal (address.contract-name)",
    );
  }

  const { numCycles, startBurnHt } = intent.data;
  if (numCycles === undefined || startBurnHt === undefined) {
    errors.data = new Error("numCycles and startBurnHt are required for a delegate intent");
  } else if (numCycles < 1 || numCycles > MAX_NUM_CYCLES) {
    errors.data = new Error(`numCycles must be between 1 and ${MAX_NUM_CYCLES}`);
  }

  // The fee is paid from the unlocked balance, separately from the amount being locked -- so the
  // amount check must reserve room for it, same as the transfer path below.
  if (intent.amount > maxSpendableAfterFees(availableNative, estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  }

  return { amount: intent.amount, totalSpent: intent.amount + estimatedFees };
}

function validateTransfer(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
): { amount: bigint; totalSpent: bigint } {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidStacksAddress(intent.recipient).isValid) {
    errors.recipient = new InvalidAddress("", { currencyName: "Stacks" });
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const isToken = intent.asset.type !== "native";
  const assetReference = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  const available = spendable(balances, isToken, assetReference);
  const availableNative = spendable(balances, false);

  const maxAmount = isToken ? available : maxSpendableAfterFees(available, estimatedFees);
  const amount = intent.useAllAmount ? maxAmount : intent.amount;

  if (intent.useAllAmount && maxAmount === 0n) {
    errors.amount = new NotEnoughBalance();
  } else if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (amount > available) {
    errors.amount = new NotEnoughBalance();
  } else if (isToken && estimatedFees > availableNative) {
    errors.amount = new NotEnoughBalance();
  }

  const totalSpent = isToken ? amount : amount + estimatedFees;
  return { amount, totalSpent };
}

/** Ports the legacy bridge's `getTransactionStatus` amount/balance/fee/recipient checks, plus
 * pox-5 staking-specific checks (client-side `num-cycles` bounds; no amount check for undelegate). */
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const estimatedFees = customFees?.value ?? 0n;

  const { amount, totalSpent } =
    intent.intentType === "staking"
      ? validateStaking(
          intent as StakingTransactionIntent<MemoNotSupported, StacksTxData>,
          balances,
          estimatedFees,
          errors,
        )
      : validateTransfer(intent, balances, estimatedFees, errors);

  return { errors, warnings, estimatedFees, amount, totalSpent };
}
