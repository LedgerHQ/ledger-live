import invariant from "invariant";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import {
  FF_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_ENABLED,
  FF_PAY_TAB,
} from "@e2e/utils/featureFlagUtils";

const ALL_STABLECOINS = "All stablecoins";
const BANK_TRANSFER_CREATE_ACCOUNT = "Create an account";
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");
const { currency } = transaction.accountToDebit;

async function initPayTabApp() {
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
}

export function runPayBalanceAndDepositTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await initPayTabApp();
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

      await app.payTab.filterBalance(currency.ticker.toLowerCase());
      await app.payTab.expectFilterPill(currency.ticker);
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
      await app.payTab.expectRequestTitle(`Request ${currency.name}`);
      await app.payTab.closeRequest();
      await app.payTab.expectFundedBalance();
    });
  });
}

export function runPayRequestTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await initPayTabApp();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("Request a payment", async () => {
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openRequest();
      await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
      await app.payTab.expectRequestTitle(`Request ${currency.name}`);
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

export function runPayNewPaymentTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await app.init({
        userdata: "wallet40-many-stablecoins",
        speculosApp: transaction.accountToDebit.currency.speculosApp,
        featureFlags: {
          ...FF_PAY_TAB,
          ...FF_CONTACTS_ENABLED,
          ...FF_NEW_SEND_FLOW_ENABLED,
        },
        cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("New payment", async () => {
      const address = transaction.accountToCredit.address;
      invariant(address, "Recipient address is not set");
      const youPaid = `You paid ${formatAddress(address, SEND_ADDRESS_FORMAT_OPTIONS)}`;

      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openNewPayment();
      await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
      await app.newSend.typeRecipientNewFlow(address);
      await app.newSend.tapRecipientCardSend();
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.payTab.expectYouPaid(youPaid);
      await app.payTab.closePaySuccess();
      await app.payTab.expectScreenVisible();
    });
  });
}
