import { test } from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { getEnv } from "@ledgerhq/live-env";

function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    if (originalBroadcastValue !== undefined) {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    } else {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    }
  });
}

const e2eDelegationAccounts = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2740, B2CQA-2770",
  },
  {
    delegate: new Delegate(Account.SOL_1, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2742",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2741",
  },
  {
    delegate: new Delegate(Account.INJ_1, "0.0000001", "Ledger by Chorus One"),
    xrayTicket: "B2CQA-3021",
  },
  {
    delegate: new Delegate(Account.OSMO_1, "0.0001", "Ledger by Figment"),
    xrayTicket: "B2CQA-3022",
  },
];

const e2eDelegationAccountsWithoutBroadcast = [
  {
    delegate: new Delegate(Account.ADA_1, "0.01", "LBF3 - Ledger by Figment 3"),
    xrayTicket: "B2CQA-3023",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-3020",
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
    delegate: new Delegate(Account.ADA_2, "0.01", "LBF2 - Ledger by Figment 2"),
    xrayTicket: "B2CQA-2766",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_2, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2767",
  },
  {
    delegate: new Delegate(Account.OSMO_2, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-2768",
  },
];

const liveApps = [
  {
    delegate: new Delegate(Account.ETH_1, "0.01", "lido"),
    xrayTicket: "B2CQA-3024",
  },
  {
    delegate: new Delegate(Account.TRX_1, "1", "stakekit"),
    xrayTicket: "B2CQA-3025", //todo: Add split from when parent ticket is available
  },
  {
    delegate: new Delegate(Account.DOT_1, "1", "stakekit"),
    xrayTicket: "B2CQA-3026", //todo: Add split from when parent ticket is available
  },
];

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
        annotation: { type: "TMS", description: account.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.delegate.account.accountName);

        if (account.delegate.account.currency.name == Currency.INJ.name) {
          await app.speculos.activateExpertMode();
        }

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.verifyFirstProviderName(account.delegate.provider);
        if (account.delegate.account.currency.name == Currency.SOL.name) {
          await app.delegate.verifyContinueDisabled();
          await app.delegate.selectProviderByName(account.delegate.provider);
          await app.delegate.verifyProviderTC(account.delegate.provider);
          await app.delegate.verifyProvider(1);
        }
        await app.delegate.continue();
        await app.delegate.fillAmount(account.delegate.amount);
        await app.delegate.continue();

        await app.speculos.signDelegationTransaction(account.delegate);
        await app.delegate.verifySuccessMessage();
        await app.delegate.clickViewDetailsButton();

        await app.drawer.waitForDrawerToBeVisible();
        await app.delegateDrawer.verifyTxTypeIsVisible();

        const transactionType =
          account.delegate.account.currency.name === Currency.NEAR.name ? "Staked" : "Delegated";
        await app.delegateDrawer.verifyTxTypeIs(transactionType);

        await app.delegateDrawer.providerIsVisible(account.delegate);
        await app.delegateDrawer.amountValueIsVisible(account.delegate.account.currency.ticker);
        await app.delegateDrawer.operationTypeIsCorrect(transactionType);
        await app.drawer.closeDrawer();

        if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          await app.layout.syncAccounts();
          await app.account.clickOnLastOperation();
          await app.delegateDrawer.expectDelegationInfos(account.delegate);
          await app.delegateDrawer.verifyTxTypeIs(transactionType);
          await app.delegateDrawer.operationTypeIsCorrect(transactionType);
        }
      },
    );
  });
}

for (const account of e2eDelegationAccountsWithoutBroadcast) {
  test.describe("Delegate without Broadcasting", () => {
    setupEnv(true);
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
      `[${account.delegate.account.currency.name}] Delegate without broadcasting`,
      {
        annotation: { type: "TMS", description: account.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.continue();

        if (account.delegate.account.currency.name == Currency.ADA.name) {
          await app.delegate.openSearchProviderModal();
          await app.delegate.inputProvider(account.delegate.provider);
          await app.delegate.selectProviderByName(account.delegate.provider);
        } else {
          await app.delegate.verifyFirstProviderName(account.delegate.provider);
        }

        await app.delegate.continue();

        if (account.delegate.account.currency.name == Currency.ADA.name) {
          await app.delegate.verifyValidatorName("Ledger by Figment 3 [LBF3]");
          await app.delegate.verifyFeesVisible();
          await app.delegate.continue();
        } else {
          await app.delegate.fillAmount(account.delegate.amount);
          await app.delegate.continue();
        }

        await app.speculos.signDelegationTransaction(account.delegate);
        await app.delegate.verifySuccessMessage();

        if (account.delegate.account.currency.name !== Currency.ADA.name) {
          await app.delegate.clickViewDetailsButton();

          await app.drawer.waitForDrawerToBeVisible();
          await app.delegateDrawer.verifyTxTypeIsVisible();
          await app.delegateDrawer.verifyTxTypeIs("Delegated");
          await app.delegateDrawer.providerIsVisible(account.delegate);
          await app.delegateDrawer.amountValueIsVisible(account.delegate.account.currency.ticker);
          await app.delegateDrawer.operationTypeIsCorrect("Delegated");
          await app.drawer.closeDrawer();
        }
      },
    );
  });
}

test.describe("e2e delegation - Tezos", () => {
  const account = new Delegate(Account.XTZ_1, "N/A", "Ledger by Kiln");
  setupEnv(true);
  test.use({
    userdata: "skip-onboarding",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: account.account.currency.ticker,
          index: account.account.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    "Tezos Delegation",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-3041",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.clickDelegateToEarnRewardsButton();
      await app.delegate.verifyTezosDelegateInfos(account.account.currency.id, account.provider);
      await app.delegate.continue();
      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();
      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Delegated");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.operationTypeIsCorrect("Delegated");
      await app.drawer.closeDrawer();
    },
  );
});

test.describe("e2e delegation - Celo", () => {
  const account = new Delegate(Account.CELO_1, "0.001", "N/A");
  test.use({
    userdata: "skip-onboarding",
    speculosApp: account.account.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: account.account.currency.ticker,
          index: account.account.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    "Celo Delegation",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-3042",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.account.accountName);
      await app.speculos.activateContractData();
      await app.account.startStakingFlowFromMainStakeButton();
      await app.delegate.checkCeloManageAssetModal();
      await app.delegate.clickCeloLockButton();
      await app.delegate.fillAmount(account.amount);
      await app.delegate.verifyLockInfoCeloWarning();
      await app.delegate.continue();
      await app.speculos.signDelegationTransaction(account);
      await app.delegate.verifySuccessMessage();
      await app.delegate.clickViewDetailsButton();
      await app.drawer.waitForDrawerToBeVisible();
      await app.delegateDrawer.verifyTxTypeIsVisible();
      await app.delegateDrawer.verifyTxTypeIs("Locked");
      await app.delegateDrawer.providerIsVisible(account);
      await app.delegateDrawer.operationTypeIsCorrect("Locked");
      await app.drawer.closeDrawer();
    },
  );
});

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
        annotation: { type: "TMS", description: validator.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(validator.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.delegate.continue();

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
      await app.delegate.continue();
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
      await app.delegate.continue();
    },
  );
});

for (const currency of liveApps) {
  test.describe("LiveApp delegate", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: currency.delegate.account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: currency.delegate.account.currency.ticker,
            index: currency.delegate.account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `[${currency.delegate.account.currency.name}] - Select validator`,
      {
        annotation: { type: "TMS", description: currency.xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(currency.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        if (currency.delegate.account.currency.name == Currency.ETH.name) {
          await app.delegate.chooseStakeProvider(currency.delegate.provider);
        }
        await app.liveApp.verifyLiveAppTitle(currency.delegate.provider);
      },
    );
  });
}
