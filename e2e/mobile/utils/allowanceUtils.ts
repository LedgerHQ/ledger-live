import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { allure } from "jest-allure2-reporter/api";
import { getEnv } from "@shared/env";
import { deleteSpeculos, launchSpeculos, registerSpeculos } from "@e2e/utils/speculosUtils";

/**
 * Revokes `account`'s ERC-20 allowance for `spender`, then asserts it settled at zero.
 *
 * Signs on a Speculos of its own and re-registers the caller's device afterwards, so this is
 * safe to call once a test's Speculos is already registered. `label` names the spender in the
 * failure message and the Allure entry.
 */
export async function revokeAllowance(account: TokenAccount, spender: string, label: string) {
  let allowance = await getTokenAllowanceCommand(account, spender);
  if (allowance !== "0") {
    const previousSpeculosPort = getEnv("SPECULOS_API_PORT");
    const speculos = await launchSpeculos(account.currency.speculosApp.name);
    await registerSpeculos(speculos.port);
    try {
      const result = await revokeTokenCommand(account, spender);
      allure.description(`Token revoke result for ${label}:\n\n ${result}`);
    } finally {
      await deleteSpeculos(speculos.id);
      if (previousSpeculosPort > 0) {
        await registerSpeculos(previousSpeculosPort);
      }
    }
    allowance = await getTokenAllowanceCommand(account, spender);
  }
  if (allowance !== "0") {
    throw new Error(
      `Token allowance revoke did not settle for ${label}: expected "0", got "${allowance}"`,
    );
  }
}
