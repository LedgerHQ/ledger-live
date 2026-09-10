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
 * The live app renders its token-approval step only while the allowance is short, and
 * `resetLoanState` closes positions but never allowances.
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

/** Asserted, not just read: each market borrows its own token. */
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
