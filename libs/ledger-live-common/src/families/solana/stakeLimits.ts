import BigNumber from "bignumber.js";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { getStakeAccountMinimumBalanceForRentExemption } from "@ledgerhq/coin-solana/network/chain/web3";
import { chainConfigFrom } from "@ledgerhq/coin-solana/utils";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getPendingNativeSpent } from "../../bridge/generic-coin-framework/utils";
import { getCurrencyConfiguration } from "../../config";

type StakeLimitsBridge = Pick<AccountBridge<TransactionCommon>, "estimateMaxSpendable">;

/** What the largest stake account amount is made of, in lamports. */
export type SolanaStakeAmountInputs = {
  rent: BigNumber;
  spendableBalance: BigNumber;
  pendingDebits: BigNumber;
  /** The generic bridge's send-max for a new stake account: it leaves the rent in. */
  maxSpendable: BigNumber;
};

export type SolanaStakeLimitInputs = SolanaStakeAmountInputs & { minimumDelegation: BigNumber };

export type SolanaStakeAmounts = {
  maxStakeable: BigNumber;
  feeReserve: BigNumber;
};

/**
 * The one definition of the largest `stake.createAccount` amount: coin-solana's `validateIntent`
 * requires the stake account rent on top of a typed amount, so it is the bridge send-max (spendable
 * minus pending debits, network fee and unstake reserve) minus that rent.
 */
export function computeSolanaStakeAmounts({
  rent,
  spendableBalance,
  pendingDebits,
  maxSpendable,
}: SolanaStakeAmountInputs): SolanaStakeAmounts {
  const maxStakeable = BigNumber.max(maxSpendable.minus(rent), 0);
  const feeReserve = BigNumber.max(
    spendableBalance.minus(pendingDebits).minus(rent).minus(maxStakeable),
    0,
  );
  return { maxStakeable, feeReserve };
}

type SolanaChainApi = ReturnType<typeof getChainAPI>;

function chainApiOf(account: Account): SolanaChainApi {
  const config = getCurrencyConfiguration<SolanaCoinConfig>(account.currency.id);
  return getChainAPI(chainConfigFrom(config));
}

async function readAmountInputs(
  account: Account,
  bridge: StakeLimitsBridge,
  transaction: TransactionCommon,
  api: SolanaChainApi,
): Promise<SolanaStakeAmountInputs> {
  const [rent, maxSpendable] = await Promise.all([
    getStakeAccountMinimumBalanceForRentExemption(api),
    bridge.estimateMaxSpendable({ account, transaction }),
  ]);
  return {
    rent: new BigNumber(rent),
    spendableBalance: account.spendableBalance,
    pendingDebits: getPendingNativeSpent(account.pendingOperations ?? []),
    maxSpendable,
  };
}

/** The inputs of {@link computeSolanaStakeAmounts}, read through the bridge and the chain. */
export function readSolanaStakeAmountInputs(
  account: Account,
  bridge: StakeLimitsBridge,
  transaction: TransactionCommon,
): Promise<SolanaStakeAmountInputs> {
  return readAmountInputs(account, bridge, transaction, chainApiOf(account));
}

/** The same inputs plus the minimum delegation, for callers that explain a refused amount. */
export async function readSolanaStakeLimitInputs(
  account: Account,
  bridge: StakeLimitsBridge,
  transaction: TransactionCommon,
): Promise<SolanaStakeLimitInputs> {
  const api = chainApiOf(account);
  const [minimumDelegation, amountInputs] = await Promise.all([
    api.getStakeMinimumDelegation(),
    readAmountInputs(account, bridge, transaction, api),
  ]);
  return { ...amountInputs, minimumDelegation: new BigNumber(minimumDelegation) };
}
