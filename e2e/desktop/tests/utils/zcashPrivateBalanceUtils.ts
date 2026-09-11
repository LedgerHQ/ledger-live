import { CliCommand } from "tests/fixtures/common";
import { Application } from "tests/page";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

/**
 * Shared by activate.private.balance.spec.ts and receive.private.address.spec.ts:
 * both drive the same Zcash BST account under the zcashShielded flag, differing
 * only in extra cliCommands (the latter also seeds privateInfo).
 */
export function zcashPrivateBalanceTestUse(account: Account, extraCliCommands: CliCommand[] = []) {
  return {
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account), ...extraCliCommands],
    featureFlags: {
      zcashShielded: {
        enabled: true,
      },
    },
  };
}

export function zcashPrivateBalanceTestOptions(account: Account, xrayTicket: string) {
  return {
    tag: buildTags({ currencyId: account.currency.id }),
    annotation: {
      type: "TMS" as const,
      description: xrayTicket,
    },
  };
}

export async function openZcashAccountUnderTest(app: Application, account: Account) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(account.accountName);
  await app.account.expectAccountVisibility(account.accountName);
}
