import invariant from "invariant";
import {
  buildSeededContacts,
  generateContactName,
  type ContactSeed,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import type { Contact } from "@domain/entity-contact";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { importContacts } from "@e2e/bridge/server";
import {
  FF_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_ENABLED,
  FF_PAY_TAB,
} from "@e2e/utils/featureFlagUtils";

const ALL_STABLECOINS = "All stablecoins";
const FILTER_TICKER = "USDT";
const REQUEST_TITLE = "Request Tether USD";

const CONTACT_ID = "e2e-pay-contact";
const CONTACT_ADDRESS_ID = "e2e-pay-contact-main";
const CONTACT_NAME = generateContactName();
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");

const TMS_LINKS = ["B2CQA-6325", "B2CQA-6326", "B2CQA-6327", "B2CQA-6328"];
const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

function payContactSeed(address: string): ContactSeed {
  return {
    id: CONTACT_ID,
    name: CONTACT_NAME,
    addresses: [
      {
        id: CONTACT_ADDRESS_ID,
        currencyId: transaction.accountToCredit.currency.id,
        label: "Main",
        address,
      },
      {
        id: "e2e-pay-contact-spare",
        currencyId: transaction.accountToCredit.currency.id,
        label: "Spare",
        address: Addresses.EVM_SPARE,
      },
    ],
  };
}

setTeamOwner(Team.WALLET_XP);
describe("Pay tab", () => {
  TMS_LINKS.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({
      userdata: "paytab",
      speculosApp: transaction.accountToDebit.currency.speculosApp,
      featureFlags: {
        ...FF_PAY_TAB,
        ...FF_CONTACTS_ENABLED,
        ...FF_NEW_SEND_FLOW_ENABLED,
      },
      cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
    });
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();

    const address = transaction.accountToCredit.address;
    invariant(address, "Recipient address is not set");
    const seeded = buildSeededContacts([payContactSeed(address)]) as Contact[];
    await importContacts(seeded);
  });

  it("Pay tab end to end", async () => {
    const address = transaction.accountToCredit.address;
    invariant(address, "Recipient address is not set");
    const accountName =
      transaction.accountToDebit.parentAccount?.accountName ??
      transaction.accountToDebit.accountName;

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
    await app.payTab.expectBankTransferIntro();
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

    await app.payTab.openNewPayment();
    await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
    await app.newSend.typeRecipientNewFlow(address);
    await app.newSend.tapRecipientCardSend();
    await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
    await app.newSend.waitForSignature();
    await app.speculos.signSendTransaction(transaction);
    await app.payTab.expectYouPaid();
    await app.payTab.closePaySuccess();
    await app.payTab.expectScreenVisible();

    await app.payTab.selectContact(0);
    await app.newSend.selectContactAddress(CONTACT_ADDRESS_ID);
    await app.modularDrawer.selectAccount(accountName);
    await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
    await app.newSend.waitForSignature();
    await app.speculos.signSendTransaction(transaction);
    await app.payTab.expectPaySuccess(CONTACT_NAME);
    await app.payTab.closePaySuccess();
    await app.payTab.expectScreenVisible();
  });
});
