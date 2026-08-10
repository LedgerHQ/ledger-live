import { setEnv } from "@shared/env";
import { DelegateType } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
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
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  tagSuite(tmsLinks, tags);
  describe("Staking - Tezos", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Earning choice routes to delegate and stake`, async () => {
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
      await app.tezosStake.verifyAwaitingDelegation();
    });
  });
}

export function runStakeTezos(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  tagSuite(tmsLinks, tags);
  describe("Staking - Tezos", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Stake on a delegated account`, async () => {
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
  describe("Staking - Tezos", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Unstake from a staked account`, async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      await app.tezosStake.openUnstakeFromStakingSection();
      await app.tezosStake.verifyUnstakeAmountInfo();
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
      ? `[${delegation.account.currency.testLabel}] - Change validator is blocked while staked`
      : `[${delegation.account.currency.testLabel}] - Stop delegation is blocked while staked`;
  describe("Staking - Tezos", () => {
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
