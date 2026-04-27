import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { verifyAddedFundedAccount } from "tests/utils/addAccountUtils";

const currencies = [
  {
    currency: Currency.BTC,
    xrayTicket: "B2CQA-2499, B2CQA-2644, B2CQA-2672, B2CQA-2073, B2CQA-786",
  },
  { currency: Currency.ETH, xrayTicket: "B2CQA-2503, B2CQA-929, B2CQA-2645, B2CQA-2673" },
  { currency: Currency.ETC, xrayTicket: "B2CQA-2502, B2CQA-2646, B2CQA-2674" },
  { currency: Currency.XRP, xrayTicket: "B2CQA-2505, B2CQA-2647, B2CQA-2675" },
  { currency: Currency.DOT, xrayTicket: "B2CQA-2504, B2CQA-2648, B2CQA-2676" },
  { currency: Currency.TRX, xrayTicket: "B2CQA-2508, B2CQA-2649, B2CQA-2677" },
  { currency: Currency.ADA, xrayTicket: "B2CQA-2500, B2CQA-2650, B2CQA-2678" },
  { currency: Currency.XLM, xrayTicket: "B2CQA-2506, B2CQA-2651, B2CQA-2679" },
  { currency: Currency.BCH, xrayTicket: "B2CQA-2498, B2CQA-2652, B2CQA-2680" },
  { currency: Currency.ALGO, xrayTicket: "B2CQA-2497, B2CQA-2653, B2CQA-2681" },
  { currency: Currency.ATOM, xrayTicket: "B2CQA-2501, B2CQA-2654, B2CQA-2682" },
  { currency: Currency.XTZ, xrayTicket: "B2CQA-2507, B2CQA-2655, B2CQA-2683" },
  { currency: Currency.SOL, xrayTicket: "B2CQA-2642, B2CQA-2656, B2CQA-2684" },
  { currency: Currency.TON, xrayTicket: "B2CQA-2643, B2CQA-2657, B2CQA-2685" },
  { currency: Currency.APT, xrayTicket: "B2CQA-3644, B2CQA-3645, B2CQA-3646" },
  { currency: Currency.BASE, xrayTicket: "B2CQA-4226, B2CQA-4227, B2CQA-4228" },
  { currency: Currency.ZEC, xrayTicket: "B2CQA-4296, B2CQA-4297, B2CQA-4298" },
];

for (const currency of currencies) {
  test.describe("Add Accounts", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: currency.currency.speculosApp,
    });

    const family = getFamilyByCurrencyId(currency.currency.id);

    test(
      `[${currency.currency.name}] Add account`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${currency.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
          ...(currency.currency === Currency.ETH ? ["@smoke"] : []),
        ],
        annotation: {
          type: "TMS",
          description: currency.xrayTicket,
        },
      },
      async ({ app, userdataFile }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        const firstAccountName = `${currency.currency.name} 1`;

        await app.portfolio.waitForPortfolioEmptyState();
        await app.portfolio.clickAddAccountButton();

        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.validateItems();
          await selector.selectAssetByTicker(currency.currency);
          await selector.selectNetwork(currency.currency);
          await app.scanAccountsDrawer.selectFirstAccount();
          await app.scanAccountsDrawer.clickCloseButton();
        } else {
          await app.addAccount.expectModalVisibility();
          await app.addAccount.selectCurrency(currency.currency);
          await app.addAccount.addAccounts();
          await app.addAccount.done();
        }

        await app.portfolio.checkOperationHistory();
        await verifyAddedFundedAccount(app, userdataFile, firstAccountName);
      },
    );
  });
}

test.describe("Add Accounts - Aleo", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: Currency.ALEO.speculosApp,
    featureFlags: {
      // TODO: this can be removed once Aleo is released on production
      currencyAleo: {
        enabled: true,
      },
    },
  });

  const family = getFamilyByCurrencyId(Currency.ALEO.id);

  test(
    `[${Currency.ALEO.name}] Add account`,
    {
      tag: [
        "@NanoSP",
        "@Flex",
        "@NanoGen5",
        "@NanoX",
        "@Stax",
        `@${Currency.ALEO.id}`,
        ...(family ? [`@family-${family}`] : []),
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-4450, B2CQA-4451, B2CQA-4452",
      },
    },
    async ({ app, userdataFile }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const firstAccountName = `${Currency.ALEO.name} 1`;

      await app.portfolio.waitForPortfolioEmptyState();
      await app.portfolio.clickAddAccountButton();

      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.validateItems();
        await selector.selectAssetByTicker(Currency.ALEO);
        await selector.selectNetwork(Currency.ALEO);
        await app.scanAccountsDrawer.expectViewKeyWarningVisibility();
        await app.scanAccountsDrawer.clickAllowButton();
        await app.scanAccountsDrawer.selectFirstAccountAndGoToViewKeyConfirmation();
        await app.speculos.shareViewKey();
        await app.scanAccountsDrawer.expectSuccessStepVisibility();
        await app.scanAccountsDrawer.clickCloseButton();
      } else {
        await app.addAccount.expectModalVisibility();
        await app.addAccount.selectCurrency(Currency.ALEO);
        await app.addAccount.addAccounts();
        await app.addAccount.done();
      }

      await app.portfolio.checkOperationHistory();
      await verifyAddedFundedAccount(app, userdataFile, firstAccountName);
    },
  );
});
