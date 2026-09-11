import { setEnv } from "@shared/env";
import { DelegateType } from "@ledgerhq/live-e2e-shared/models/Delegate";
import type { Account as AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { delegateTeamOwner } from "@ledgerhq/live-e2e-shared/data/delegateTeamOwner";
import {
  MINA_DELEGATION_PAIR,
  MINA_REDELEGATION_ACCOUNT,
  pickMinaAccountToDelegate,
  pickMinaAccountToUndelegate,
  pickMinaRedelegation,
  pickMinaValidator,
} from "@ledgerhq/live-e2e-shared/families/minaStakingState";
import { verifyAppValidationStakeInfo, verifyStakeOperationDetailsInfo } from "@e2e/models/stake";
import { FF_MINA_STAKING_ENABLED } from "@e2e/utils/featureFlagUtils";
import type { PartialFeatures } from "@shared/feature-flags";
import { getCurrencyManagerApp } from "@e2e/models/currencies";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

const beforeAllFunction = async (delegation: DelegateType, featureFlags?: PartialFeatures) => {
  await app.init({
    speculosApp: delegation.account.currency.speculosApp,
    cliCommands: [liveDataWithAddressCommand(delegation.account)],
    featureFlags,
  });

  await app.mainNavigation.waitForWallet40Ready();
};

export function runDelegateTest(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Delegate`, async () => {
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
      // Osmosis, like MultiversX, has no pre-selected validator: pick it after the amount.
      if (
        delegation.account.currency.name === Currency.MULTIVERS_X.name ||
        delegation.account.currency.name === Currency.OSMO.name
      ) {
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
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Delegate`, async () => {
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
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Undelegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Undelegate`, async () => {
      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);

      const currencyId = delegation.account.currency.id;

      await app.undelegate.tapStakingRow(currencyId, 0);
      await app.undelegate.tapUnstakeAction(currencyId);
      await app.undelegate.enterAmount(currencyId, delegation.amount);
      await app.undelegate.continueFromAmount(currencyId);

      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(delegation.account.accountName);
      await app.operationDetails.checkTransactionType("UNDELEGATE");
    });
  });
}

const minaBeforeAll = (accounts: AccountType[]) => async () => {
  await app.init({
    speculosApp: Currency.MINA.speculosApp,
    cliCommands: accounts.map(account => liveDataCommand(account)),
    featureFlags: FF_MINA_STAKING_ENABLED,
  });

  await app.mainNavigation.waitForWallet40Ready();
};

function startMinaSpec(tmsLinks: string[], tags: string[]) {
  setTeamOwner(delegateTeamOwner(Currency.MINA.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
}

export function runMinaDelegateTest(tmsLinks: string[], tags: string[]) {
  startMinaSpec(tmsLinks, tags);
  describe("Delegate", () => {
    // Either account of the pair can be the free one, so both are seeded.
    beforeAll(minaBeforeAll(MINA_DELEGATION_PAIR));

    it(`[${Currency.MINA.testLabel}] - Delegate`, async () => {
      const account = await pickMinaAccountToDelegate();
      const validator = await pickMinaValidator();
      const delegation = new Delegate(account, "N/A", validator.name, validator.address);
      const amountWithCode = delegation.amount + " " + Currency.MINA.ticker;
      const currencyId = Currency.MINA.id;

      await app.portfolio.goToAccounts(Currency.MINA.name);
      await app.common.goToAccountByName(account.accountName);
      await app.account.tapEarn();

      // Mina delegates the whole balance, so the flow opens on the validator list and has no
      // amount step.
      await app.stake.selectValidatorFromList(delegation.provider);
      await app.stake.expectProvider(currencyId, delegation.provider);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(delegation, amountWithCode);
    });
  });
}

export function runMinaRedelegateTest(tmsLinks: string[], tags: string[]) {
  startMinaSpec(tmsLinks, tags);
  describe("Redelegate", () => {
    beforeAll(minaBeforeAll([MINA_REDELEGATION_ACCOUNT]));

    it(`[${Currency.MINA.testLabel}] - Redelegate`, async () => {
      const { account, validatorAddress } = await pickMinaRedelegation();
      const validator = await pickMinaValidator(validatorAddress);
      const delegation = new Delegate(account, "N/A", validator.name, validator.address);
      const currencyId = Currency.MINA.id;

      await app.portfolio.goToAccounts(Currency.MINA.name);
      await app.common.goToAccountByName(account.accountName);

      // Redelegating reopens the delegate flow on the validator list.
      await app.undelegate.tapStakingRow(currencyId);
      await app.undelegate.tapRedelegateAction(currencyId);
      await app.stake.selectValidatorFromList(delegation.provider);
      await app.stake.expectProvider(currencyId, delegation.provider);
      await app.stake.summaryContinue(currencyId);

      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(account.accountName);
      await app.operationDetails.checkTransactionType("REDELEGATE");
    });
  });
}

export function runMinaUndelegateTest(tmsLinks: string[], tags: string[]) {
  startMinaSpec(tmsLinks, tags);
  describe("Undelegate", () => {
    // Either account of the pair can be the delegated one, so both are seeded.
    beforeAll(minaBeforeAll(MINA_DELEGATION_PAIR));

    it(`[${Currency.MINA.testLabel}] - Undelegate`, async () => {
      // Undelegating delegates back to the account itself, and the device review renders that raw
      // address: the speculos helper asserts against it, hence no target validator here.
      const account = await pickMinaAccountToUndelegate();
      const delegation = new Delegate(account, "N/A", "N/A");

      await app.portfolio.goToAccounts(Currency.MINA.name);
      await app.common.goToAccountByName(account.accountName);

      // Undelegating returns the whole balance, so the action prepares the transaction itself and
      // goes straight to the device.
      await app.undelegate.tapStakingRow(Currency.MINA.id);
      await app.undelegate.tapUnstakeAction(Currency.MINA.id);

      await app.speculos.signDelegationTransaction(delegation);
      await app.common.successViewDetails();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(account.accountName);
      await app.operationDetails.checkTransactionType("UNDELEGATE");
    });
  });
}

export function runLockCelo(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Lock`, async () => {
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
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Vote`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.celoManageAssets.checkManagePage();
      await app.celoManageAssets.clickVote();
      const provider = await app.stake.selectFirstValidator(delegation.account.currency.id);
      const votedDelegation = { ...delegation, provider };

      await app.stake.openCeloVoteAmount();
      await app.stake.setCeloVoteAmount(delegation.amount);

      await app.stake.validateCeloVoteAmount();
      await app.stake.celoVoteSummaryContinue();

      await verifyAppValidationStakeInfo(votedDelegation, amountWithCode);
      await app.speculos.signDelegationTransaction(votedDelegation);

      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(votedDelegation, amountWithCode, undefined, "VOTE");
    });
  });
}

export function runDelegateTezos(delegation: DelegateType, tmsLinks: string[], tags: string[]) {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  setTeamOwner(delegateTeamOwner(delegation.account.currency.id));
  tags.forEach(tag => $Tag(tag));
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  describe("Delegate", () => {
    beforeAll(async () => {
      await beforeAllFunction(delegation);
    });

    it(`[${delegation.account.currency.testLabel}] - Delegate`, async () => {
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
