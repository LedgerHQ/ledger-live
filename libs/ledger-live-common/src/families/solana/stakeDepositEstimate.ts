import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge/impl";
import {
  computeUseAllAmount,
  getNativeSpendableAfterPending,
} from "../../bridge/generic-coin-framework/utils";
import {
  computeSolanaStakeAmounts,
  readSolanaStakeAmountInputs,
  type SolanaStakeAmountInputs,
} from "./stakeLimits";
import { createStakeAccountTransaction } from "./transactions";

export type SolanaStakeDepositEstimateFailure =
  | "balance_unavailable"
  | "rent_unavailable"
  | "fee_unavailable"
  | "unstake_reserve_unavailable"
  | "candidate_refused";

/** The message is fixed: nothing about the account or the RPC travels with it. */
export class SolanaStakeDepositEstimateError extends Error {
  readonly reason: SolanaStakeDepositEstimateFailure;

  constructor(reason: SolanaStakeDepositEstimateFailure) {
    super(`The stake deposit estimate is unavailable (${reason})`);
    this.name = "SolanaStakeDepositEstimateError";
    this.reason = reason;
  }
}

const BELOW_MINIMUM_DELEGATION = "SolanaStakeAccountAmountTooLow";

type PreparedStakeTransaction = {
  fees?: BigNumber | null;
  stakeAccountRent?: BigNumber;
  feeParameters?: Record<string, unknown>;
};

type PricedStake = { fee: BigNumber; feeWithUnstakeReserve: BigNumber; rent: BigNumber };

function asLamports(value: unknown): BigNumber | undefined {
  const isNumeric =
    BigNumber.isBigNumber(value) ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint";
  if (!isNumeric) return undefined;
  const lamports = new BigNumber(value.toString());
  return lamports.isInteger() && lamports.gte(0) ? lamports : undefined;
}

function isPositive(value: BigNumber | undefined): value is BigNumber {
  return value !== undefined && value.gt(0);
}

function unavailable(reason: SolanaStakeDepositEstimateFailure): never {
  throw new SolanaStakeDepositEstimateError(reason);
}

function assertBalancesAvailable({ spendableBalance, pendingOperations }: Account): void {
  const hasSpendable = BigNumber.isBigNumber(spendableBalance) && spendableBalance.isFinite();
  if (!hasSpendable || !Array.isArray(pendingOperations)) unavailable("balance_unavailable");
}

function assertInputsAvailable({ rent, maxSpendable }: SolanaStakeAmountInputs): void {
  if (!isPositive(asLamports(rent))) unavailable("rent_unavailable");
  if (asLamports(maxSpendable) === undefined) unavailable("balance_unavailable");
}

/** The figures the estimation of the prepared transaction reported, each of them required. */
function readPricedStake(prepared: PreparedStakeTransaction): PricedStake {
  const fee = asLamports(prepared.fees);
  if (!isPositive(fee)) return unavailable("fee_unavailable");
  // Pricing the unstake takes two transaction fees: a reserve of zero is a failed pricing.
  const feeWithUnstakeReserve = asLamports(prepared.feeParameters?.reserve);
  if (!feeWithUnstakeReserve?.gt(fee)) return unavailable("unstake_reserve_unavailable");
  const rent = asLamports(prepared.stakeAccountRent);
  if (!isPositive(rent)) return unavailable("rent_unavailable");
  return { fee, feeWithUnstakeReserve, rent };
}

function amountBoundOfPricedStake(
  account: Account,
  inputs: SolanaStakeAmountInputs,
  { fee, feeWithUnstakeReserve, rent }: PricedStake,
): BigNumber {
  const maxSpendable = computeUseAllAmount(
    {
      value: BigInt(fee.toFixed()),
      parameters: { reserve: BigInt(feeWithUnstakeReserve.toFixed()) },
    },
    getNativeSpendableAfterPending(account),
  );
  return computeSolanaStakeAmounts({ ...inputs, rent, maxSpendable }).maxStakeable;
}

function assertAmountAccepted(refusal: Error | undefined): void {
  if (refusal && refusal.name !== BELOW_MINIMUM_DELEGATION) unavailable("candidate_refused");
}

/**
 * The largest `stake.createAccount` amount the account can fund now, in lamports: the shared stake
 * amount (bridge send-max minus the stake account rent), cut down to what the estimation of the
 * prepared transaction allows, and returned once the host's own `getTransactionStatus` accepts it.
 * Below the minimum delegation it is still the answer: that minimum is a separate rule.
 *
 * It rejects when a component is unavailable (balance, rent, fee, unstake reserve), when an RPC call
 * fails or when the validation refuses the amount, so no silent zero stands in for a missing figure.
 */
export async function estimateSolanaStakeDepositMax(account: Account): Promise<BigNumber> {
  assertBalancesAvailable(account);
  const bridge = await getAccountBridge(account);
  const draft = bridge.updateTransaction(
    bridge.createTransaction(account),
    createStakeAccountTransaction(""),
  );

  const inputs = await readSolanaStakeAmountInputs(account, bridge, draft);
  assertInputsAvailable(inputs);
  const { maxStakeable } = computeSolanaStakeAmounts(inputs);
  if (maxStakeable.isZero()) return maxStakeable;

  const prepared: PreparedStakeTransaction = await bridge.prepareTransaction(
    account,
    bridge.updateTransaction(draft, { amount: maxStakeable }),
  );
  const amount = BigNumber.min(
    maxStakeable,
    amountBoundOfPricedStake(account, inputs, readPricedStake(prepared)),
  );
  if (amount.isZero()) return amount;

  const status = await bridge.getTransactionStatus(
    account,
    bridge.updateTransaction(prepared, { amount }),
  );
  assertAmountAccepted(status.errors.amount);
  return amount;
}
