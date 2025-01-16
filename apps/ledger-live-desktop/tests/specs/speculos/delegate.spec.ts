import { test } from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { addTmsLink, addBugLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getEnv } from "@ledgerhq/live-env";

const e2eDelegationAccounts = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2740, B2CQA-2770",
    bugTicket: "LIVE-14501",
  },
  {
    delegate: new Delegate(Account.SOL_1, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2742",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2741",
  },
];

const validators = [
  {
    delegate: new Delegate(Account.ATOM_2, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2731, B2CQA-2763",
  },
  {
    delegate: new Delegate(Account.SOL_2, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2730, B2CQA-2764",
  },
  {
    delegate: new Delegate(Account.NEAR_2, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2732, B2CQA-2765",
  },
  {
    delegate: new Delegate(Account.ADA_1, "0.01", "LBF3 - Ledger by Figment 3"),
    xrayTicket: "B2CQA-2766",
    bugTicket: "LIVE-15536",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2767",
  },
  {
    delegate: new Delegate(Account.OSMO_1, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2768",
  },
];

test.describe("Delegate flows", () => {
  for (const account of e2eDelegationAccounts) {
    test.describe("Delegate", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.delegate.account.currency.speculosApp,
        cliCommands: [
          (appjsonPath: string) => {
            return CLI.liveData({
              currency: account.delegate.account.currency.ticker,
              index: account.delegate.account.index,
              add: true,
              appjson: appjsonPath,
            });
          },
        ],
      });

      test(
        `[${account.delegate.account.currency.name}] Delegate`,
        {
          annotation: [
            { type: "TMS", description: account.xrayTicket },
            { type: "BUG", description: account.bugTicket },
          ],
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          if (account.bugTicket) {
            await addBugLink(getDescription(test.info().annotations, "BUG").split(", "));
          }

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(account.delegate.account.accountName);

          await app.account.clickBannerCTA();
          await app.delegate.verifyFirstProviderName(account.delegate.provider);
          if (account.delegate.account.currency.name == Currency.SOL.name) {
            await app.delegate.verifyContinueDisabled();
            await app.delegate.selectProviderByName(account.delegate.provider);
            await app.delegate.verifyProviderTC(account.delegate.provider);
            await app.delegate.verifyProvider(1);
          }
          await app.delegate.continueDelegate();
          await app.delegate.fillAmount(account.delegate.amount);
          await app.modal.countinueSendAmount();

          await app.speculos.signDelegationTransaction(account.delegate);
          await app.delegate.clickViewDetailsButton();

          await app.drawer.waitForDrawerToBeVisible();
          await app.delegateDrawer.transactionTypeIsVisible();
          await app.delegateDrawer.providerIsVisible(account.delegate);
          await app.delegateDrawer.amountValueIsVisible();
          await app.drawer.closeDrawer();

          if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
            await app.layout.syncAccounts();
            await app.account.clickOnLastOperation();
            await app.delegateDrawer.expectDelegationInfos(account.delegate);
          }
        },
      );
    });
  }

  for (const validator of validators) {
    test.describe("Select a validator", () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: validator.delegate.account.currency.speculosApp,
        cliCommands: [
          (appjsonPath: string) => {
            return CLI.liveData({
              currency: validator.delegate.account.currency.ticker,
              index: validator.delegate.account.index,
              add: true,
              appjson: appjsonPath,
            });
          },
        ],
      });

      test(
        `[${validator.delegate.account.currency.name}] - Select validator`,
        {
          annotation: [
            { type: "TMS", description: validator.xrayTicket },
            { type: "BUG", description: validator.bugTicket },
          ],
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          if (validator.bugTicket) {
            await addBugLink(getDescription(test.info().annotations, "BUG").split(", "));
          }

          await app.layout.goToAccounts();
          await app.accounts.navigateToAccountByName(validator.delegate.account.accountName);

          await app.account.startStakingFlowFromMainStakeButton();
          await app.modal.continue();

          await app.delegate.verifyFirstProviderName(validator.delegate.provider);
          if (validator.delegate.account.currency.name == Currency.SOL.name) {
            await app.delegate.verifyContinueDisabled();
            await app.delegate.selectProviderByName(validator.delegate.provider);
            await app.delegate.verifyProviderTC(validator.delegate.provider);
          } else await app.delegate.verifyContinueEnabled();
          await app.delegate.verifyProvider(1);
          await app.delegate.openSearchProviderModal();
          await app.delegate.checkValidatorListIsVisible();
          await app.delegate.selectProviderOnRow(2);
          await app.delegate.closeProviderList(2);
        },
      );
    });
  }

  test.describe("Staking flow from different entry point", () => {
    const delegateAccount = new Delegate(Account.ATOM_1, "0.001", "Ledger");
    test.use({
      userdata: "skip-onboarding",
      speculosApp: delegateAccount.account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: delegateAccount.account.currency.ticker,
            index: delegateAccount.account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      "Staking flow from portfolio entry point",
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-2769",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToPortfolio();
        await app.portfolio.startStakeFlow();

        await app.assetDrawer.selectAsset(delegateAccount.account.currency);
        await app.assetDrawer.selectAccountByIndex(delegateAccount.account);

        await app.delegate.verifyFirstProviderName(delegateAccount.provider);
        await app.delegate.continueDelegate();
      },
    );

    test(
      "Staking flow from market entry point",
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-2771",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToMarket();
        await app.market.search(delegateAccount.account.currency.name);
        await app.market.stakeButtonClick(delegateAccount.account.currency.ticker);

        await app.assetDrawer.selectAccountByIndex(delegateAccount.account);

        await app.delegate.verifyFirstProviderName(delegateAccount.provider);
        await app.delegate.continueDelegate();
      },
    );
  });
});
