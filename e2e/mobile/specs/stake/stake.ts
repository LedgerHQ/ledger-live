import { DelegateType } from "@ledgerhq/live-common/e2e/models/Delegate";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { verifyTezosStakingOperationDetails } from "../../models/stake";

const TEZOS_STAKING_TAGS = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@tezos",
  "@family-tezos",
];

const STAKING_FEATURE_FLAGS = { llmTezosStaking: { enabled: true } };

// Broadcast follows DISABLE_TRANSACTION_BROADCAST via setupEnvironment (off by default; "0" to
// broadcast on-chain), matching desktop — so these suites intentionally don't override it.

async function initStakingAccount(delegation: DelegateType) {
  await app.init({
    speculosApp: delegation.account.currency.speculosApp,
    cliCommands: [liveDataWithAddressCommand(delegation.account)],
    featureFlags: STAKING_FEATURE_FLAGS,
  });
  await app.mainNavigation.waitForWallet40Ready();
}

async function goToTezosAccount(delegation: DelegateType) {
  await app.portfolio.goToAccounts(delegation.account.currency.name);
  await app.common.goToAccountByName(delegation.account.accountName);
}

function tagSuite(tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.BST);
  tags.forEach(tag => $Tag(tag));
  tmsLinks.forEach(tms => $TmsLink(tms));
}

export function runEarningChoiceTezos(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  tagSuite(tmsLinks, tags);
  describe("Earning choice on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Earning choice delegates and awaits the delegation", async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      await app.account.tapEarn();
      await app.tezosStake.verifyEarningChoice();
      await app.tezosStake.startEarning();
      await app.tezosStake.verifyDelegationSummary();
      await app.tezosStake.continueFromDelegationSummary();
      await app.speculos.signDelegationTransaction(delegation);
      await app.tezosStake.stakeAfterDelegation();
      await app.tezosStake.verifyStakeStepAfterDelegation();
    });
  });
}

export function runStakeTezos(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  tagSuite(tmsLinks, tags);
  describe("Stake flow on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Stake on a delegated account", async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      await app.account.tapEarn();
      await app.tezosStake.fillStakeAmount(delegation.amount);
      await app.tezosStake.continueStakeAmount();
      await app.deviceValidation.expectDeviceValidationScreen();
      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();
      await verifyTezosStakingOperationDetails(delegation, "stake");
    });
  });
}

export function runUnstakeTezos(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  tagSuite(tmsLinks, tags);
  describe("Unstake flow on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Unstake from a staked account", async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      await app.tezosStake.openUnstakeFromStakingSection();
      await app.tezosStake.fillUnstakeAmount(delegation.amount);
      await app.tezosStake.continueUnstakeAmount();
      await app.deviceValidation.expectDeviceValidationScreen();
      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();
      await verifyTezosStakingOperationDetails(delegation, "unstake");
    });
  });
}

export function runUnstakeRequiredTezos(
  delegation: DelegateType,
  action: "changeValidator" | "stopDelegation",
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  tagSuite(tmsLinks, tags);
  const title =
    action === "changeValidator"
      ? "Change validator is blocked while staked"
      : "Stopping delegation is blocked while staked";
  describe(`Unstake required guard on TEZOS - ${action}`, () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it(title, async () => {
      await goToTezosAccount(delegation);
      if (action === "changeValidator") {
        await app.tezosStake.openChangeValidator();
      } else {
        await app.tezosStake.openStopDelegation();
      }
      await app.tezosStake.verifyUnstakeRequired();
      await app.tezosStake.dismissUnstakeRequired();
    });
  });
}
