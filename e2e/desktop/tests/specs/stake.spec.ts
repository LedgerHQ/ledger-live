import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";

const family = getFamilyByCurrencyId(Account.XTZ_1.currency.id);

// Shared modal/test config for the Tezos staking specs. DISABLE_TRANSACTION_BROADCAST is off by
// default (CI never broadcasts); set it to "0" locally to broadcast + confirm the op on-chain.
const tezosStakeUse = (account: Delegate) => ({
  env: { DISABLE_TRANSACTION_BROADCAST: process.env.DISABLE_TRANSACTION_BROADCAST || "1" },
  teamOwner: Team.BST,
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: account.account.currency.speculosApp,
  cliCommands: [liveDataCommand(account.account)],
  featureFlags: { lldTezosStaking: { enabled: true } },
});

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

// Two accounts: XTZ_1 (index 0) funded + UNDELEGATED for the earning-choice chooser; XTZ_2 (index 1)
// DELEGATED + STAKED for the stake (Earn -> stake modal) and unstake (staking-section menu) flows.
// (index 0 must stay undelegated: the legacy receive/add-account/delegate Tezos specs rely on it.)
test.describe("e2e staking - Tezos - earning choice", () => {
  const account = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");

  // Force no broadcast: signing here would otherwise delegate idx0 on-chain.
  test.use({ ...tezosStakeUse(account), env: { DISABLE_TRANSACTION_BROADCAST: "1" } });

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
      await app.tezosStake.verifyValidatorStep();
      await app.tezosStake.continueFromValidator();
      await app.speculos.signDelegationTransaction(account);
      // No success screen here by design: the flow advances to the staking amount step, which waits
      // for the (un-broadcast) delegation to confirm.
      await app.tezosStake.verifyAwaitingDelegation();
    },
  );
});

test.describe("e2e staking - Tezos - stake", () => {
  const account = new Delegate(Account.XTZ_2, "0.005", "Ledger by Kiln");

  test.use(tezosStakeUse(account));

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
      // Visiting the account closes the modal and routes to /account/:id.
      await app.account.expectAccountHeaderVisible();
    },
  );
});

test.describe("e2e staking - Tezos - unstake", () => {
  const account = new Delegate(Account.XTZ_2, "0.005", "Ledger by Kiln");

  test.use(tezosStakeUse(account));

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
  const account = new Delegate(Account.XTZ_2, "N/A", "Ledger by Kiln");

  // Assertion-only (never signs).
  test.use(tezosStakeUse(account));

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
      await app.tezosUnstakeRequired.clickCloseButton();
    },
  );
});

test.describe("e2e staking - Tezos - end delegation blocked", () => {
  const account = new Delegate(Account.XTZ_2, "N/A", "Ledger by Kiln");

  // Assertion-only (never signs).
  test.use(tezosStakeUse(account));

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
      await app.tezosUnstakeRequired.clickCloseButton();
    },
  );
});
