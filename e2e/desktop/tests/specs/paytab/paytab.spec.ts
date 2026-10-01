import invariant from "invariant";
import {
  buildSeededContacts,
  generateContactName,
  type ContactSeed,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_LWD_CONTACTS_ENABLED,
  FF_LWD_PAY_TAB,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { NEW_SEND_FLOW_FAMILIES } from "tests/utils/newSendFlowUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const ALL_STABLECOINS = "All stablecoins";
const FILTER_TICKER = "USDT";
const REQUEST_TITLE = "Request Tether USD";

const CONTACT_ID = "e2e-pay-contact";
const CONTACT_ADDRESS_ID = "e2e-pay-contact-main";
const CONTACT_NAME = generateContactName();
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");

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

test.describe("Pay tab", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
    settings: {
      shareAnalytics: false,
      hasSeenAnalyticsOptInPrompt: true,
      hasDismissedContactsFeatureIntroduction: true,
    },
    featureFlags: {
      ...FF_LWD_PAY_TAB,
      ...FF_LWD_CONTACTS_ENABLED,
      ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
      newSendFlow: {
        enabled: true,
        params: { families: NEW_SEND_FLOW_FAMILIES },
      },
    },
  });

  test.beforeEach(async ({ app }) => {
    const address = transaction.accountToCredit.address;
    invariant(address, "Recipient address is not set");
    await app.redux.dispatch({
      type: "contacts/setContacts",
      payload: buildSeededContacts([payContactSeed(address)]),
    });
  });

  test(
    "Stable balance and deposit options",
    {
      tag: [...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-6325" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("pay");
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
      await app.swap.goAndWaitForSwapToBeReady(() => app.payTab.selectDepositOption("swap"));
      await app.mainNavigation.openTargetFromMainNavigation("pay");
      await app.payTab.expectScreenVisible();

      await app.payTab.openDepositOptions();
      await app.payTab.selectDepositOption("buy");
      await app.buyAndSell.verifyBuySellScreenIsVisible();
      await app.mainNavigation.openTargetFromMainNavigation("pay");
      await app.payTab.expectScreenVisible();

      await app.payTab.openDepositOptions();
      await app.payTab.selectDepositOption("receive");
      await app.modularDialog.validateAssetsDialogItems();
      await app.payTab.closeDialog();
      await app.payTab.expectScreenVisible();
    },
  );

  test(
    "Request a payment",
    {
      tag: [...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-6326" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("pay");
      await app.payTab.openRequest();
      await app.modularDialog.selectAssetByTicker(Currency.ETH_USDT);
      await app.modularDialog.selectNetwork(Currency.ETH_USDT);
      await app.modularDialog.selectAccountByName(transaction.accountToDebit);
      await app.payTab.expectRequestTitle(REQUEST_TITLE);
      await app.payTab.expectRequestAddress();
      await app.payTab.expectRequestQrCode();
      await app.payTab.expectRequestSave();
      await app.payTab.expectRequestCopy();
      await app.payTab.expectRequestVerify();
      await app.payTab.closeRequest();
      await app.payTab.expectFundedBalance();
    },
  );

  test(
    "New payment",
    {
      tag: [...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-6327" },
    },
    async ({ app }) => {
      const address = transaction.accountToCredit.address;
      invariant(address, "Recipient address is not set");
      await app.mainNavigation.openTargetFromMainNavigation("pay");
      await app.payTab.openNewPayment();
      await app.modularDialog.selectAssetByTicker(Currency.ETH_USDT);
      await app.modularDialog.selectNetwork(Currency.ETH_USDT);
      await app.modularDialog.selectAccountByName(transaction.accountToDebit);
      await app.newSendFlow.waitForDialog();
      await app.newSendFlow.typeAddress(address);
      await app.newSendFlow.clickRecipientCardSend();
      await app.newSendFlow.fillCryptoAmount(transaction.amount);
      await app.newSendFlow.clickReview();
      await app.newSendFlow.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.payTab.expectYouPaid();
      await app.payTab.closePaySuccess();
      await app.payTab.expectScreenVisible();
    },
  );

  test(
    "Pay a contact",
    {
      tag: [...DEVICE_TAGS],
      annotation: { type: "TMS", description: "B2CQA-6328" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("pay");
      await app.payTab.expectScreenVisible();
      await app.payTab.selectContact(CONTACT_ID);
      await app.payTab.selectContactAddress(CONTACT_ADDRESS_ID);
      await app.modularDialog.selectAccountByName(transaction.accountToDebit);
      await app.newSendFlow.waitForDialog();
      await app.newSendFlow.fillCryptoAmount(transaction.amount);
      await app.newSendFlow.clickReview();
      await app.newSendFlow.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.payTab.expectPaySuccess(CONTACT_NAME);
      await app.payTab.closePaySuccess();
      await app.payTab.expectScreenVisible();
    },
  );
});
