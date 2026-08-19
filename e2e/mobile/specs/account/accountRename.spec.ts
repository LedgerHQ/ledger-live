import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { launchApp } from "../../helpers/commonHelpers";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { loadConfig } from "../../bridge/server";
import { device } from "detox";
// FLAKE-SIM: test-quarantine pipeline validation — REMOVE BEFORE MERGE.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// FLAKE-SIM — REMOVE BEFORE MERGE.
// Detox reruns a failed spec in a FRESH jest process, so a module-scope counter
// would reset and the test would fail on every attempt. State has to outlive the
// process, hence the marker file: absent = attempt 1 (fail), present = retry (pass).
const FLAKE_SIM_MARKER = join(process.cwd(), "artifacts", "flake-sim", "accountRename.marker");

function flakeSimFailFirstAttempt(): void {
  if (!process.env.CI || existsSync(FLAKE_SIM_MARKER)) return;
  mkdirSync(dirname(FLAKE_SIM_MARKER), { recursive: true });
  writeFileSync(FLAKE_SIM_MARKER, "1", "utf8");
  throw new Error("FLAKE-SIM: forced failure on attempt 1 (mobile detox)");
}

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-2996");

const tags: string[] = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  `@bitcoin`,
  `@family-bitcoin`,
];
tags.forEach(tag => $Tag(tag));
describe("Rename account", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  const newAccountName = "New Account Name";

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [liveDataCommand(account)],
      speculosForSetupOnly: true,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it(`[${account.currency.testLabel}] - Rename account and persist after restart`, async () => {
    flakeSimFailFirstAttempt(); // FLAKE-SIM — REMOVE BEFORE MERGE.
    await app.accounts.openViaDeeplink();
    await app.common.expectAccountName(account.accountName);
    await app.common.goToAccountByName(account.accountName);
    await app.account.openAccountSettings();
    await app.account.selectAccountRename();
    await app.account.enterNewAccountName(newAccountName);
    await app.accounts.openViaDeeplink();
    await app.common.expectAccountName(newAccountName);
    await device.terminateApp();
    await launchApp({ newInstance: true });
    await device.disableSynchronization();
    await loadConfig("skip-onboarding", true);
    await app.mainNavigation.waitForWallet40Ready();
    await device.enableSynchronization();
    await app.portfolio.goToSpecificAsset(account.currency.name);
    await app.common.expectAccountName(newAccountName);
  });
});
