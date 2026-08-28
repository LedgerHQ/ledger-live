import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { resolveCollateralSpender } from "@ledgerhq/live-e2e-shared/borrow/borrowApi";
import { DEFAULT_COLLATERAL } from "@ledgerhq/live-e2e-shared/borrow/borrowSetup";
import { allure } from "jest-allure2-reporter/api";
import { getEnv } from "@shared/env";
import { deleteSpeculos, launchSpeculos, registerSpeculos } from "@e2e/utils/speculosUtils";

/**
 * Leaves the collateral allowance at zero so the "Give approval" step is always required.
 * The partner approves an exact amount, so a run that approves and then fails before
 * supplying leaves a residue behind, and `resetLoanState` only closes positions.
 *
 * Broadcasts; gated by the caller's `shouldRunBroadcastFlow`.
 */
export async function resetCollateralAllowance(collateralAccount: TokenAccount) {
  const owner = collateralAccount.parentAccount ?? collateralAccount;
  const ownerAddress = await getAccountAddress(owner);

  const spender = await resolveCollateralSpender(ownerAddress, DEFAULT_COLLATERAL);
  let allowance = await getTokenAllowanceCommand(collateralAccount, spender);
  if (allowance !== "0") {
    const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
    const speculos = await launchSpeculos(collateralAccount.currency.speculosApp.name);
    await registerSpeculos(speculos.port);
    try {
      const result = await revokeTokenCommand(collateralAccount, spender);
      await allure.description(`Collateral allowance revoke result:\n\n ${result}`);
    } finally {
      await deleteSpeculos(speculos.id);
      if (previousSpeculosPort > 0) {
        await registerSpeculos(previousSpeculosPort);
      }
    }
    allowance = await getTokenAllowanceCommand(collateralAccount, spender);
  }
  if (allowance !== "0") {
    throw new Error(
      `Collateral allowance revoke did not settle for ${spender}: expected "0", got "${allowance}"`,
    );
  }
}
