import { setEnv } from "@ledgerhq/live-env";
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

// Mobile twin of desktop's lldTezosStaking; the staking screens, routing and the account-screen
// staking section are all gated on it (default off).
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
  describe("Earning choice on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Earning choice routes to the delegation summary", async () => {
      await goToTezosAccount(delegation);
      // Funded + undelegated => Earn opens the earning-choice chooser (not the legacy delegate starter).
      await app.account.tapEarn();
      await app.tezosStake.verifyEarningChoice();
      await app.tezosStake.startEarning();
      // Undelegated => the single chooser CTA leads into the delegation summary.
      await app.tezosStake.verifyDelegationSummary();
    });
  });
}

export function runStakeTezos(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[] = TEZOS_STAKING_TAGS,
) {
  // Broadcast off so CI never mutates the seed; the app still reaches the success screen.
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  tagSuite(tmsLinks, tags);
  describe("Stake flow on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Stake on a delegated account", async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      // Already delegated => Earn opens the stake amount step directly (skipDelegation).
      await app.account.tapEarn();
      await app.tezosStake.fillStakeAmount(delegation.amount);
      await app.tezosStake.continueStakeAmount();
      await app.deviceValidation.expectDeviceValidationScreen();
      // Tezos signs stake via the same on-device review flow as delegation.
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
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  tagSuite(tmsLinks, tags);
  describe("Unstake flow on TEZOS", () => {
    beforeAll(async () => {
      await initStakingAccount(delegation);
    });

    it("Unstake from a staked account", async () => {
      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();
      await goToTezosAccount(delegation);
      // Delegated + staked => the staking section card opens the unstake action.
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
  setEnv("DISABLE_TRANSACTION_BROADCAST", true); // assertion-only: never signs or broadcasts
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
      // Delegated + staked => both actions hit the "unstake first" guard instead of the real flow.
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
