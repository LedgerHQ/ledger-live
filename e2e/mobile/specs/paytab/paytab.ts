import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { FF_CONTACTS_ENABLED, FF_PAY_TAB } from "@e2e/utils/featureFlagUtils";

const ALL_STABLECOINS = "All stablecoins";
const FILTER_TICKER = "USDT";
const REQUEST_TITLE = "Request Tether USD";
// i18n `payTab.bankTransferIntro.createAccount`
const BANK_TRANSFER_CREATE_ACCOUNT = "Create an account";
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");

export function runPayBalanceAndDepositTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "wallet40-many-stablecoins",
        speculosApp: transaction.accountToDebit.currency.speculosApp,
        featureFlags: {
          ...FF_PAY_TAB,
          ...FF_CONTACTS_ENABLED,
        },
        cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("Stable balance and deposit options", async () => {
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.expectFundedBalance();
      await app.payTab.expectBalanceAmount();
      await app.payTab.expectFilterPill(ALL_STABLECOINS);

      await app.payTab.filterBalance(FILTER_TICKER.toLowerCase());
      await app.payTab.expectFilterPill(FILTER_TICKER);
      await app.payTab.filterBalance("all");
      await app.payTab.expectFilterPill(ALL_STABLECOINS);

      await app.payTab.openDepositOptions();
      await app.payTab.expectDepositOptions();
      await app.payTab.selectDepositOption("bankTransfer");
      await app.payTab.expectBankTransferIntro(BANK_TRANSFER_CREATE_ACCOUNT);
      await app.payTab.closeBankTransferIntro();
      await app.payTab.expectScreenVisible();

      await app.payTab.openDepositOptions();
      await app.payTab.selectDepositOption("swap");
      await app.swap.expectSwapPage();
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();

      await app.payTab.openDepositOptions();
      await app.payTab.selectDepositOption("buy");
      await app.buySell.expectBuyScreenToBeVisible();
      await app.buySell.closeBuyScreen();
      await app.payTab.expectScreenVisible();

      await app.payTab.openDepositOptions();
      await app.payTab.selectDepositOption("receive");
      await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
      await app.payTab.expectRequestTitle(REQUEST_TITLE);
      await app.payTab.closeRequest();
      await app.payTab.expectFundedBalance();
    });
  });
}

export function runPayRequestTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "wallet40-many-stablecoins",
        speculosApp: transaction.accountToDebit.currency.speculosApp,
        featureFlags: {
          ...FF_PAY_TAB,
          ...FF_CONTACTS_ENABLED,
        },
        cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("Request a payment", async () => {
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openRequest();
      await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
      await app.payTab.expectRequestTitle(REQUEST_TITLE);
      await app.payTab.expectRequestAddress();
      await app.payTab.expectRequestQrCode();
      await app.payTab.expectRequestShare();
      await app.payTab.expectRequestCopy();
      await app.payTab.expectRequestVerify();
      await app.payTab.closeRequest();
      await app.payTab.expectFundedBalance();
    });
  });
}
