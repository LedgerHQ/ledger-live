import { setEnv } from "@ledgerhq/live-env";
import { DelegateType } from "@ledgerhq/live-e2e-shared/models/Delegate";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { verifyAppValidationStakeInfo, verifyStakeOperationDetailsInfo } from "../../models/stake";
import { getCurrencyManagerApp } from "../../models/currencies";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const BST_DELEGATE_CURRENCIES = new Set(["cardano", "near"]);

const beforeAllFunction = async (delegation: DelegateType) => {
  await app.init({
    speculosApp: delegation.account.currency.speculosApp,
    cliCommands: [liveDataWithAddressCommand(delegation.account)],
  });

  await app.mainNavigation.waitForWallet40Ready();
};

export function runDelegateTest(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(
    BST_DELEGATE_CURRENCIES.has(delegation.account.currency.id) ? Team.BST : Team.COIN_INTEGRATION,
  );
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Delegate on ${delegation.account.currency.name}`, async () => {
      let fees;
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId =
        getCurrencyManagerApp(delegation.account.currency.id) ?? delegation.account.currency.id;

      if (delegation.account.currency.name == Currency.INJ.name) {
        await app.speculos.activateExpertMode();
      }

      await app.portfolio.goToAccounts(delegation.account.currency.name);

      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      if (delegation.account.currency.name === Currency.MULTIVERS_X.name) {
        await app.stake.setAmount(currencyId, delegation.amount);
        await app.stake.validateAmount(currencyId);
        await app.stake.selectValidator(currencyId, delegation.provider);
      } else if (delegation.account.currency.name !== Currency.ADA.name) {
        await app.stake.setAmount(currencyId, delegation.amount);
        await app.stake.validateAmount(currencyId);
      } else {
        await app.stake.selectValidator(currencyId, delegation.provider);
        await app.stake.verifyFeesVisible(currencyId);
        fees = await app.stake.getDisplayedFees(currencyId);
      }
      await app.stake.expectProvider(currencyId, delegation.provider);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(delegation, amountWithCode, fees);
      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(delegation, amountWithCode, fees);
    });
  });
}

export function runSuiDelegateTest(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Delegate on ${delegation.account.currency.name}`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.id;

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      await app.stake.setAmount(currencyId, delegation.amount);
      await app.stake.validateAmount(currencyId);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(delegation, amountWithCode);
    });
  });
}

export function runSuiUndelegateTest(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Undelegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Undelegate on ${delegation.account.currency.name}`, async () => {
      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);

      await app.undelegate.tapStakingRow();
      await app.undelegate.tapUnstakeAction();
      await app.undelegate.enterAmount(delegation.amount);
      await app.undelegate.continueFromAmount();

      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(delegation.account.accountName);
      await app.operationDetails.checkTransactionType("UNDELEGATE");
    });
  });
}

export function runDelegateDefaultValidatorTest(
  delegation: DelegateType,
  tmsLinks: string[],
  tags: string[],
) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate - default validator", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Defaults to ${delegation.provider} on ${delegation.account.currency.name}`, async () => {
      const currencyId =
        getCurrencyManagerApp(delegation.account.currency.id) ?? delegation.account.currency.id;

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      await app.stake.expectProvider(currencyId, delegation.provider);
    });
  });
}

export function runLockCelo(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe(`Lock flow on CELO`, () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Lock on CELO`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.id;

      await app.portfolio.goToAccounts(delegation.account.currency.name);

      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.celoManageAssets.checkManagePage();
      await app.celoManageAssets.clickLock();
      await app.stake.setCeloLockAmount(delegation.amount);
      await app.stake.validateAmount(currencyId);

      await verifyAppValidationStakeInfo(delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);

      await app.common.successViewDetails();
      await verifyStakeOperationDetailsInfo(delegation, amountWithCode);
    });
  });
}

export function runVoteCelo(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe(`Vote flow on CELO`, () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Vote on CELO with ${delegation.provider}`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.celoManageAssets.checkManagePage();
      await app.celoManageAssets.clickVote();
      await app.stake.selectValidator(delegation.account.currency.id, delegation.provider);

      await app.stake.openCeloVoteAmount();
      await app.stake.setCeloVoteAmount(delegation.amount);

      await app.stake.validateCeloVoteAmount();
      await app.stake.celoVoteSummaryContinue();

      await verifyAppValidationStakeInfo(delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);

      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(delegation, amountWithCode, undefined, "VOTE");
    });
  });
}

export function runDelegateTezos(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  setTeamOwner(Team.BST);
  tags.forEach(tag => $Tag(tag));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe(`Delegate flow on TEZOS`, () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`Delegate on TEZOS`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.id;

      await app.speculos.goToSettings();
      await app.speculos.activateExpertMode();

      await app.portfolio.goToAccounts(delegation.account.currency.name);

      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);

      await app.common.successViewDetails();
      await verifyStakeOperationDetailsInfo(delegation, amountWithCode);
    });
  });
}
