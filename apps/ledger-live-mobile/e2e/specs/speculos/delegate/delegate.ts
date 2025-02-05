import { setEnv } from "@ledgerhq/live-env";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import {
  verifyAppValidationStakeInfo,
  verifyStakeOperationDetailsInfo,
} from "../../../models/stake";
import { Application } from "../../../page";
import { CLI } from "../../../utils/cliUtils";
import { device } from "detox";

export async function runDelegateTest(delegation: Delegate, tmsLink: string) {
  const app = new Application();

  $TmsLink(tmsLink);
  describe(`Delegate flow on  ${delegation.account.currency.name}`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: delegation.account.currency.speculosApp,
        cliCommands: [
          () => {
            return CLI.liveData({
              currency: delegation.account.currency.currencyId,
              index: delegation.account.index,
              add: true,
              appjson: app.userdataPath,
            });
          },
        ],
      });

      await app.portfolio.waitForPortfolioPageToLoad();
    });

    it(`Delegate on ${delegation.account.currency.name}`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.currencyId;

      await app.accounts.openViaDeeplink();
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      await app.stake.setAmount(currencyId, delegation.amount);
      await app.stake.validateAmount(currencyId);
      await app.stake.expectProvider(currencyId, delegation.provider);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(app, delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);
      await device.disableSynchronization();
      await app.common.successViewDetails();

      await verifyStakeOperationDetailsInfo(app, delegation, amountWithCode);
    });
  });
}

export async function runDelegateCelo(delegation: Delegate, tmsLink: string) {
  const app = new Application();

  $TmsLink(tmsLink);
  describe(`Delegate flow on CELO`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: delegation.account.currency.speculosApp,
        cliCommands: [
          () => {
            return CLI.liveData({
              currency: delegation.account.currency.currencyId,
              index: delegation.account.index,
              add: true,
              appjson: app.userdataPath,
            });
          },
        ],
      });

      await app.portfolio.waitForPortfolioPageToLoad();
    });

    it(`Delegate on CELO`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.currencyId;

      await app.speculos.activateContractData();

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.celoManageAssets.checkManagePage();
      await app.celoManageAssets.clickLock();
      await app.stake.setCeloLockAmount(delegation.amount);
      await app.stake.validateAmount(currencyId);

      await verifyAppValidationStakeInfo(app, delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);
      await device.disableSynchronization();

      await app.common.successViewDetails();
      await verifyStakeOperationDetailsInfo(app, delegation, amountWithCode);
    });
  });
}

export async function runDelegateTezos(delegation: Delegate, tmsLink: string) {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  const app = new Application();

  $TmsLink(tmsLink);
  describe(`Delegate flow on TEZOS`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: delegation.account.currency.speculosApp,
        cliCommands: [
          () => {
            return CLI.liveData({
              currency: delegation.account.currency.currencyId,
              index: delegation.account.index,
              add: true,
              appjson: app.userdataPath,
            });
          },
        ],
      });

      await app.portfolio.waitForPortfolioPageToLoad();
    });

    it(`Delegate on TEZOS`, async () => {
      const amountWithCode = delegation.amount + " " + delegation.account.currency.ticker;
      const currencyId = delegation.account.currency.currencyId;

      await app.speculos.activateContractData();

      await app.portfolio.goToAccounts(delegation.account.currency.name);
      await app.common.goToAccountByName(delegation.account.accountName);
      await app.account.tapEarn();

      await app.stake.dismissDelegationStart(currencyId);
      await app.stake.summaryContinue(currencyId);

      await verifyAppValidationStakeInfo(app, delegation, amountWithCode);
      await app.speculos.signDelegationTransaction(delegation);
      await device.disableSynchronization();

      await app.common.successViewDetails();
      await verifyStakeOperationDetailsInfo(app, delegation, amountWithCode);
    });
  });
}
