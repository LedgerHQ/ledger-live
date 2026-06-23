import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

const family = getFamilyByCurrencyId(Account.XTZ_1.currency.id);
const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  `@${Account.XTZ_1.currency.id}`,
  ...(family ? [`@family-${family}`] : []),
];

// Two accounts: XTZ_2 (index 1) funded + UNDELEGATED for the earning-choice chooser; XTZ_1 (index 0)
// DELEGATED + STAKED for the stake (Earn -> stake modal) and unstake (staking-section menu) flows.
test.describe("e2e staking - Tezos - earning choice", () => {
  // XTZ_2: funded + undelegated -> Earn routes to the earning-choice chooser.
  const account = new Delegate(Account.XTZ_2, "N/A", "Ledger by Kiln");

  test.use({
    env: { DISABLE_TRANSACTION_BROADCAST: "1" },
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
    featureFlags: { lldTezosStaking: { enabled: true } },
  });

  test(
    "Earning choice routes to delegate and stake",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-5915" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);

      // Delegate branch: chooser -> delegate modal -> close (nothing signed; account stays undelegated).
      await app.account.startStakingFlowFromMainStakeButton();
      await app.tezosEarningChoice.chooseDelegate();
      await app.delegate.verifyDelegationStarter();
      await app.delegate.close();

      // Stake branch: chooser -> 5-step stake modal -> sign the delegation step.
      await app.account.startStakingFlowFromMainStakeButton();
      await app.tezosEarningChoice.chooseStake();
      await app.tezosStake.continueFromValidator();
      await app.speculos.signDelegationTransaction(account);
      // No success screen here by design: the flow advances to the staking amount step, which waits
      // for the (un-broadcast) delegation to confirm.
      await app.tezosStake.verifyAwaitingDelegation();
    },
  );
});

test.describe("e2e staking - Tezos - stake", () => {
  // XTZ_1 must be already delegated + funded so pressing Earn opens the stake modal directly.
  const account = new Delegate(Account.XTZ_1, "0.005", "Ledger by Kiln");

  test.use({
    // off by default (CI); run with DISABLE_TRANSACTION_BROADCAST=0 to broadcast + confirm the stake on-chain.
    env: { DISABLE_TRANSACTION_BROADCAST: process.env.DISABLE_TRANSACTION_BROADCAST || "1" },
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
    featureFlags: { lldTezosStaking: { enabled: true } },
  });

  test(
    "Stake on a delegated account",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-5917" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      // Already delegated => opens MODAL_TEZOS_STAKE directly at the amount step.
      await app.account.startStakingFlowFromMainStakeButton();
      await app.tezosStake.fillAmount(account.amount);
      await app.tezosStake.continueFromAmount();
      // Tezos signs the stake op via the same on-device review-and-sign flow as delegation.
      await app.speculos.signDelegationTransaction(account);
      await app.tezosStake.verifySuccessMessage();
      await app.tezosStake.clickVisitAccountButton();
    },
  );
});

test.describe("e2e staking - Tezos - unstake", () => {
  // XTZ_1 must be delegated + have a staked balance so the staking section (and its unstake menu) render.
  const account = new Delegate(Account.XTZ_1, "0.005", "Ledger by Kiln");

  test.use({
    // off by default (CI); run with DISABLE_TRANSACTION_BROADCAST=0 to broadcast + confirm the unstake on-chain.
    env: { DISABLE_TRANSACTION_BROADCAST: process.env.DISABLE_TRANSACTION_BROADCAST || "1" },
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
    featureFlags: { lldTezosStaking: { enabled: true } },
  });

  test(
    "Unstake from a staked account",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-5918" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      // Delegated + staked => the account page shows the staking section with the unstake menu.
      await app.tezosUnstake.openFromStakingMenu();
      await app.tezosUnstake.fillAmount(account.amount);
      await app.tezosUnstake.continueFromAmount();
      // Tezos signs the unstake op via the same on-device review-and-sign flow as delegation.
      await app.speculos.signDelegationTransaction(account);
      await app.tezosUnstake.verifySuccessMessage();
    },
  );
});

test.describe("e2e staking - Tezos - change validator blocked", () => {
  // XTZ_1 is delegated + staked, so changing validator is blocked until the user unstakes first.
  const account = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");

  test.use({
    env: { DISABLE_TRANSACTION_BROADCAST: "1" }, // assertion-only: never signs or broadcasts
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
    featureFlags: { lldTezosStaking: { enabled: true } },
  });

  test(
    "Change validator is blocked while staked",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-5919" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.tezosUnstakeRequired.openChangeValidator();
      await app.tezosUnstakeRequired.verifyVisible();
      await app.tezosUnstakeRequired.dismiss();
    },
  );
});

test.describe("e2e staking - Tezos - end delegation blocked", () => {
  // XTZ_1 is delegated + staked, so stopping delegation is blocked until the user unstakes first.
  const account = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");

  test.use({
    env: { DISABLE_TRANSACTION_BROADCAST: "1" }, // assertion-only: never signs or broadcasts
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [liveDataCommand(account.account)],
    featureFlags: { lldTezosStaking: { enabled: true } },
  });

  test(
    "Stopping delegation is blocked while staked",
    {
      tag: tags,
      annotation: { type: "TMS", description: "B2CQA-5921" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.tezosUnstakeRequired.openStopDelegation();
      await app.tezosUnstakeRequired.verifyVisible();
      await app.tezosUnstakeRequired.dismiss();
    },
  );
});
