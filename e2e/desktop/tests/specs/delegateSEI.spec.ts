import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Delegate } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_STAKE_PROGRAMS_MODAL } from "tests/utils/featureFlagUtils";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

const DELEGATION_AMOUNT = "1";
const delegation = new Delegate(Account.SEI_EVM_1, DELEGATION_AMOUNT, "first-available");

test.use({
  teamOwner: Team.COIN_INTEGRATION,
  userdata: "skip-onboarding-with-last-seen-device",
  speculosApp: delegation.account.currency.speculosApp,
  cliCommands: [liveDataWithAddressCommand(delegation.account, { currency: "sei_evm" })],
  featureFlags: {
    evmNativeStaking: {
      enabled: true,
      params: { supportedCurrencyIds: ["sei_evm"] },
    },
    ...FF_STAKE_PROGRAMS_MODAL,
  },
});

test.describe("SEI EVM Native Staking - Delegate flow", () => {
  test(
    `[${delegation.account.currency.name}] Delegate: start delegate, validator selected, confirm transaction`,
    {
      tag: [...deviceTagsWithoutLNS(), "@sei_evm", "@family-evm"],
      annotation: {
        type: "TMS",
        description: "B2CQA-5964",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(delegation.account.accountName);

      await app.account.startStakingFlowFromMainStakeButton();
      await app.evmDelegate.continueFromRewardsInfoIfPresent();
      await app.evmDelegate.expectValidatorListVisible();
      await app.evmDelegate.continueValidatorStep();
      await app.evmDelegate.setAmountAndContinue(DELEGATION_AMOUNT);

      await app.speculos.acceptEnableTransactionCheck();

      await app.evmDelegate.expectDeviceValidationScreen();
      await app.speculos.signEvmContractTransaction();
      await app.evmDelegate.expectSuccessMessage();
      await app.delegate.clickViewDetailsButton();

      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();

      await app.delegateDrawer.providerIsVisible(delegation);
      await app.delegateDrawer.amountValueIsVisible(delegation.account.currency.ticker);
      await app.delegateDrawer.operationTypeIsCorrect("Delegated");
      await app.drawer.closeDrawer();
    },
  );
});
