import invariant from "invariant";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  buildSeededContacts,
  generateContactName,
  type ContactSeed,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { importContacts } from "@e2e/bridge/server";
import {
  FF_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_ENABLED,
  FF_PAY_TAB,
} from "@e2e/utils/featureFlagUtils";
import type { PartialFeatures } from "@shared/feature-flags";
import { isIos } from "@e2e/helpers/commonHelpers";

const ALL_STABLECOINS = "All stablecoins";
const BANK_TRANSFER_CREATE_ACCOUNT = "Create an account";
const FREEZE = "Freeze";
const UNFREEZE = "Unfreeze";
const CONTACT_ID = "e2e-pay-contact";
const CONTACT_ADDRESS_ID = "e2e-pay-contact-main";
const CONTACT_NAME = generateContactName();
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");
const { currency } = transaction.accountToDebit;

async function initPayTabApp(featureFlags?: PartialFeatures) {
  await app.init({
    userdata: "wallet40-many-stablecoins",
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    featureFlags: {
      ...FF_PAY_TAB,
      ...FF_CONTACTS_ENABLED,
      ...featureFlags,
    },
    cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
  });
  await app.mainNavigation.waitForWallet40Ready();
}

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

      if (isIos()) {
        // TODO: QAA-1631 - bank transfer not closing for android (CI only)
        await app.payTab.openDepositOptions();
        await app.payTab.expectDepositOptions();
        await app.payTab.selectDepositOption("bankTransfer");
        await app.payTab.expectBankTransferIntro(BANK_TRANSFER_CREATE_ACCOUNT);
        await app.payTab.closeBankTransferIntro();
        await app.payTab.expectScreenVisible();
      }

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
      await initPayTabApp(FF_NEW_SEND_FLOW_ENABLED);
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("New payment", async () => {
      const address = transaction.accountToCredit.address;
      invariant(address, "Recipient address is not set");
      const expectedTitle = `You paid ${formatAddress(address, SEND_ADDRESS_FORMAT_OPTIONS)}`;

      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openNewPayment();
      await app.modularDrawer.selectAssetAndAccount(transaction.accountToDebit);
      await app.newSend.typeRecipientNewFlow(address);
      await app.newSend.tapRecipientCardSend();
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.payTab.expectYouPaid(expectedTitle);
      await app.payTab.closePaySuccess();
      await app.payTab.expectScreenVisible();
    });
  });
}

export function runPayContactTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await initPayTabApp(FF_NEW_SEND_FLOW_ENABLED);

      const address = transaction.accountToCredit.address;
      invariant(address, "Recipient address is not set");
      await importContacts(buildSeededContacts([payContactSeed(address)]));
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("Pay a contact", async () => {
      const accountName =
        transaction.accountToDebit.parentAccount?.accountName ??
        transaction.accountToDebit.accountName;

      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.selectContact(CONTACT_ID);
      await app.newSend.selectContactAddress(CONTACT_ADDRESS_ID);
      await app.modularDrawer.selectAccount(accountName);
      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.payTab.expectYouPaid(`You paid ${CONTACT_NAME}`);
      await app.payTab.closePaySuccess();
      await app.payTab.expectScreenVisible();
    });
  });
}

export function runPayFreezeTest(tmsLinks: string[], tags: string[]) {
  describe("Pay tab", () => {
    beforeAll(async () => {
      await initPayTabApp();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(link => $TmsLink(link));
    tags.forEach(tag => $Tag(tag));

    it("Freeze and unfreeze the card", async () => {
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openCardDetails();
      await app.payTab.expectCashbackRow();
      await app.payTab.expectFreezeTile(FREEZE);
      await app.payTab.openFreezeConfirmation();
      await app.payTab.confirmFreeze();
      await app.payTab.expectCardFrozen();
      await app.payTab.expectFreezeTile(UNFREEZE);
      await app.payTab.closeCardDetails();

      await app.mainNavigation.tapWallet40Tab("home");
      await app.mainNavigation.tapWallet40Tab("paytab");
      await app.payTab.expectScreenVisible();
      await app.payTab.openCardDetails();
      await app.payTab.expectCardFrozen();
      await app.payTab.expectFreezeTile(UNFREEZE);

      await app.payTab.openFreezeConfirmation();
      await app.payTab.confirmFreeze();
      await app.payTab.expectCardNotFrozen();
      await app.payTab.expectFreezeTile(FREEZE);
      await app.payTab.closeCardDetails();
    });
  });
}
