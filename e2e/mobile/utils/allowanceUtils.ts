import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { allure } from "jest-allure2-reporter/api";
import { withTemporarySpeculos } from "@e2e/utils/speculosUtils";

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
    await withTemporarySpeculos(account.currency.speculosApp.name, async () => {
      const result = await revokeTokenCommand(account, spender);
      allure.description(`Token revoke result for ${label}:\n\n ${result}`);
    });
    allowance = await getTokenAllowanceCommand(account, spender);
  }
  if (allowance !== "0") {
    throw new Error(
      `Token allowance revoke did not settle for ${label}: expected "0", got "${allowance}"`,
    );
  }
}
