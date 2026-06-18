import { log } from "@ledgerhq/logs";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";

import { getMainAccount, getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";

import { getAccountBridge } from "../../../bridge";
import { getAccountIdFromWalletAccountId } from "../../converters";
import type { NetworkFeeContext } from "./normalizer/networkFeeEstimate";

export type FetchNetworkFeeContextArgs = {
  accounts: AccountLike[];
  fromAccountId: string;
  amountFrom: string;
};

/**
 * Build a {@link NetworkFeeContext} once per `getQuotes` invocation from
 * the fee-paying account's bridge. Returns `null` on any failure
 * (account not found, bridge error, unsupported chain) so downstream
 * quotes simply skip fee fields and the `notEnoughBalanceForFees` check.
 */
export async function fetchNetworkFeeContext(
  args: FetchNetworkFeeContextArgs,
): Promise<NetworkFeeContext | null> {
  try {
    const realAccountId = getAccountIdFromWalletAccountId(args.fromAccountId);
    if (!realAccountId) {
      return null;
    }

    const fromAccount = args.accounts.find(acc => acc.id === realAccountId);
    if (!fromAccount) {
      return null;
    }

    const fromParentAccount = getParentAccount(fromAccount, args.accounts);
    let mainAccount = getMainAccount(fromAccount, fromParentAccount);
    const bridge = await getAccountBridge(fromAccount, fromParentAccount);

    // Bitcoin requires a fresh sync before `prepareTransaction` can compute
    // fees because UTXO selection depends on confirmed inputs.
    if (mainAccount.currency.id === "bitcoin") {
      try {
        mainAccount = await firstValueFrom(
          bridge
            .sync(mainAccount, { paginationConfig: {} })
            .pipe(reduce((a: Account, f: (acc: Account) => Account) => f(a), mainAccount)),
        );
      } catch (e) {
        log("swap", "fetchNetworkFeeContext: btc sync failed", e);
      }
    }

    const amountInAtomicUnits = resolveFeeEstimationAmount({
      fromAccount,
      mainAccount,
      displayAmount: args.amountFrom,
    });

    const subAccountId = fromAccount.type !== "Account" ? fromAccount.id : undefined;
    const recipient = bridge.getEstimationRecipient(mainAccount);

    const preparedTx = await bridge.prepareTransaction(mainAccount, {
      ...bridge.createTransaction(mainAccount),
      subAccountId,
      recipient,
      amount: amountInAtomicUnits,
      feesStrategy: "medium",
    } as Parameters<typeof bridge.prepareTransaction>[1]);

    const status = await bridge.getTransactionStatus(mainAccount, preparedTx);

    return buildContext(mainAccount, preparedTx, status);
  } catch (e) {
    log("swap", "fetchNetworkFeeContext: bridge failure", e);
    return null;
  }
}

/**
 * 90%-of-amount / 10%-of-balance fallback. Aggregator-reported amounts
 * occasionally exceed the spendable balance and bridges reject
 * `prepareTransaction` with `InsufficientBalance` before quoting a fee;
 * shrinking the amount avoids that without materially changing the estimate.
 * The desired amount is also capped at 90% of the spendable balance so that
 * a user-entered amount above balance still yields a preparable transaction.
 *
 * For main accounts the cap reads `mainAccount.spendableBalance` so the
 * freshly-synced BTC balance (see `fetchNetworkFeeContext`) is honored;
 * `fromAccount.spendableBalance` would otherwise be the stale pre-sync
 * value. Token sub-accounts keep `fromAccount.spendableBalance` so the
 * cap stays in token-atomic units.
 */
function resolveFeeEstimationAmount(input: {
  fromAccount: AccountLike;
  mainAccount: Account;
  displayAmount: string;
}): BigNumber {
  const displayAmount = new BigNumber(input.displayAmount);
  const magnitude = magnitudeOf(input.fromAccount);
  const balanceForCap =
    input.fromAccount.type === "TokenAccount"
      ? input.fromAccount.spendableBalance
      : input.mainAccount.spendableBalance;

  if (displayAmount.isNaN() || displayAmount.isZero()) {
    return balanceForCap.multipliedBy(0.1).integerValue(BigNumber.ROUND_DOWN);
  }

  const desired = displayAmount.shiftedBy(magnitude).multipliedBy(0.9);
  const cap = balanceForCap.multipliedBy(0.9);
  return BigNumber.min(desired, cap).integerValue(BigNumber.ROUND_DOWN);
}

function magnitudeOf(account: AccountLike): number {
  if (account.type === "TokenAccount") {
    return account.token.units[0]?.magnitude ?? 0;
  }
  return account.currency.units[0]?.magnitude ?? 0;
}

function buildContext(
  mainAccount: Account,
  preparedTx: Record<string, unknown>,
  status: { estimatedFees: BigNumber },
): NetworkFeeContext {
  const feeCurrency = mainAccount.currency;
  const feeCurrencyMagnitude = feeCurrency.units[0]?.magnitude ?? 0;

  const maxFeePerGas = coerceBigNumber(preparedTx.maxFeePerGas);
  const gasPrice = coerceBigNumber(preparedTx.gasPrice);
  const defaultGasLimit = coerceString(preparedTx.gasLimit ?? preparedTx.userGasLimit);

  return {
    maxFeePerGas,
    gasPrice,
    defaultGasLimit,
    estimatedFeesAtomic: status.estimatedFees ?? new BigNumber(0),
    balanceAtomic: mainAccount.spendableBalance,
    feeCurrencyId: feeCurrency.id,
    feeCurrencyMagnitude,
    mainAccountCurrencyId: mainAccount.currency.id,
  };
}

function coerceBigNumber(v: unknown): BigNumber | undefined {
  if (v == null) return undefined;
  if (BigNumber.isBigNumber(v)) return v;
  if (typeof v === "string" || typeof v === "number") {
    const bn = new BigNumber(v);
    return bn.isNaN() ? undefined : bn;
  }
  return undefined;
}

function coerceString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (BigNumber.isBigNumber(v)) return v.toFixed(0);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}
