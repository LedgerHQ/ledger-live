import { test } from "../../fixtures/common";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const currencies = [
  { currency: Currency.BTC, xrayTicket: "B2CQA-2499, B2CQA-2644, B2CQA-2672, B2CQA-786" },
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
];

for (const currency of currencies) {
  test.describe("Add Accounts", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: currency.currency.speculosApp,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    test(
      `[${currency.currency.name}] Add account`,
      {
        annotation: {
          type: "TMS",
          description: currency.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();
        await app.addAccount.selectCurrency(currency.currency);
        firstAccountName = await app.addAccount.getFirstAccountName();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.layout.expectBalanceVisibility();
        await app.portfolio.checkOperationHistory();
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(firstAccountName);
        await app.account.expectAccountVisibility(firstAccountName);
        await app.account.expectAccountBalance();
        await app.account.expectLastOperationsVisibility();
        await app.account.expectAddressIndex(0);
        await app.account.expectShowMoreButton();
      },
    );
  });
}
