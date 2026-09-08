import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import {
  DEFAULT_MARKET_ID,
  findPositions,
  getPositions,
  resolveCollateralSpender,
  resolveRepaySpender,
} from "@ledgerhq/live-e2e-shared/borrow/borrowApi";
import { DEFAULT_COLLATERAL, DEFAULT_LOAN } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { revokeAllowance } from "@e2e/utils/allowanceUtils";

/**
 * The live app renders its token-approval step only while the allowance is short, so a specific
 * allowance decides whether a step the spec drives exists at all. The partner approves an exact
 * amount, which means a run that approves and then fails before spending leaves a residue behind
 * — and `resetLoanState` only closes positions, never allowances.
 *
 * Each spender is resolved from the same partner action the live app posts, so a redeployed
 * adapter is followed rather than pinned. Getting that wrong is silent: zeroing an allowance the
 * UI never uses leaves the step unnecessary and the spec waiting on a screen that never renders.
 *
 * Both helpers broadcast; callers are gated by `shouldRunBroadcastFlow`.
 */
export async function resetCollateralAllowance(collateralAccount: TokenAccount) {
  const ownerAddress = await borrowAccountAddress(collateralAccount);
  const spender = await resolveCollateralSpender(ownerAddress, DEFAULT_COLLATERAL, DEFAULT_LOAN);
  await revokeAllowance(collateralAccount, spender, `borrow collateral → ${spender}`);
}

/** Needs the loan to already exist: a repay is built against the open position's `marketId`. */
export async function resetDebtAllowance(debtAccount: TokenAccount) {
  const ownerAddress = await borrowAccountAddress(debtAccount);
  const marketId = await openDebtMarketId(ownerAddress);
  const spender = await resolveRepaySpender(ownerAddress, marketId);
  await revokeAllowance(debtAccount, spender, `borrow debt → ${spender}`);
}

/** Resolves through the parent EOA, which is what holds the allowance and signs the revoke. */
function borrowAccountAddress(tokenAccount: TokenAccount): Promise<string> {
  const owner: Account = tokenAccount.parentAccount ?? tokenAccount;
  return getAccountAddress(owner);
}

/**
 * The market is asserted, not just read: each market borrows its own token, and revoking the
 * allowance of a token the loan does not owe leaves the repay approval step unrequired — which
 * shows up as the spec hanging on a step that never renders rather than as a setup error.
 */
async function openDebtMarketId(ownerAddress: string): Promise<string> {
  const loans = findPositions(await getPositions(ownerAddress));
  const withDebt = loans.find(loan => Number.parseFloat(loan.debtBalance ?? "0") > 0);
  if (!withDebt) {
    throw new Error(
      `No open loan with debt for ${ownerAddress}, so the repay allowance cannot be resolved: ${JSON.stringify(loans)}`,
    );
  }
  if (withDebt.marketId !== DEFAULT_MARKET_ID) {
    throw new Error(
      `Open loan for ${ownerAddress} is on ${withDebt.marketId}, not the default market ` +
        `${DEFAULT_MARKET_ID} this test opens — its debt token differs from the one being revoked`,
    );
  }
  return withDebt.marketId;
}
