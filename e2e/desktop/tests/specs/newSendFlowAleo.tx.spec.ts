import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { shareViewKeyCommand } from "@ledgerhq/live-e2e-shared/families/aleo";
import { Application } from "tests/page";
import { FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED } from "tests/utils/featureFlagUtils";
import {
  NEW_SEND_FLOW_FAMILIES,
  NewSendFlowEntry,
  registerNewSendFlowTests,
} from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

const PUBLIC = "public";
const PRIVATE = "private";
// One signed call (public transfer, or a private one spending a single record): 12.5s, rounded.
const SINGLE_CALL_ESTIMATED_TIME = "~13s";

const aleoSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction(Account.ALEO_1, Account.ALEO_2, "0.000001"),
    xrayTicket: "B2CQA-XXXX",
    teamOwner: Team.BST,
    balanceType: PUBLIC,
    postSeedHook: shareViewKeyCommand(Account.ALEO_1),
  },
];

registerNewSendFlowTests(aleoSendTransactions);

const useAleoSendFlow = (tx: Transaction) =>
  test.use({
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [
      liveDataWithRecipientAddressCommand(tx, {
        postSeedHook: shareViewKeyCommand(tx.accountToDebit),
      }),
    ],
    featureFlags: {
      ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
      newSendFlow: {
        enabled: true,
        params: { families: NEW_SEND_FLOW_FAMILIES },
      },
    },
  });

const aleoTags = buildTags({ currencyId: Account.ALEO_1.currency.id, skipLNS: true });

function getRecipientAddress(tx: Transaction): string {
  if (!tx.accountToCredit.address) {
    throw new Error(`Missing recipient address for ${tx.accountToCredit.accountName}`);
  }
  return tx.accountToCredit.address;
}

async function openSendFromBalance(app: Application, tx: Transaction, balanceType: string) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
  await app.account.clickSend();
  await app.newSendFlow.waitForDialog();
  await app.newSendFlow.selectBalanceType(balanceType);
  if (balanceType === PRIVATE) {
    await app.newSendFlow.waitForAleoPrivateSync();
  }
}

async function signAndExpectSent(app: Application, tx: Transaction) {
  await app.newSendFlow.fillCryptoAmount(tx.amount);
  await app.newSendFlow.expectEstimatedTime(SINGLE_CALL_ESTIMATED_TIME);
  await app.newSendFlow.clickReview();

  await app.newSendFlow.waitForSignature();
  await app.speculos.signSendTransaction(tx);
  await app.newSendFlow.waitForSuccessConfirmation();
}

test.describe("Send - new flow - Aleo", () => {
  const tx = new Transaction(Account.ALEO_1, Account.ALEO_2, "0.000001");
  useAleoSendFlow(tx);

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Public balance shows the estimated send time`,
    { tag: aleoTags, annotation: { type: "TMS", description: "B2CQA-XXXX" } },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
      await app.account.clickSend();
      await app.newSendFlow.waitForDialog();

      await app.newSendFlow.expectBalanceTypeOptions([PUBLIC, PRIVATE]);
      await app.newSendFlow.selectBalanceType(PUBLIC);

      await app.newSendFlow.typeAddress(getRecipientAddress(tx));
      await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);

      await app.newSendFlow.expectEstimatedTime(SINGLE_CALL_ESTIMATED_TIME);
      await app.newSendFlow.openEstimatedTimeInfo();
      await app.newSendFlow.closeEstimatedTimeInfo();
      await app.newSendFlow.expectEstimatedTime(SINGLE_CALL_ESTIMATED_TIME);
    },
  );

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send from private balance (new send flow)`,
    { tag: aleoTags, annotation: { type: "TMS", description: "B2CQA-XXXX" } },
    async ({ app }) => {
      await openSendFromBalance(app, tx, PRIVATE);

      await app.newSendFlow.typeAddress(getRecipientAddress(tx));
      await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
      await signAndExpectSent(app, tx);

      await app.newSendFlow.clickViewDetails();
      await app.sendDrawer.addressValueIsVisible(getRecipientAddress(tx));
    },
  );
});

test.describe("Send - new flow - Aleo self transfer", () => {
  const tx = new Transaction(Account.ALEO_1, Account.ALEO_1, "0.000001");
  useAleoSendFlow(tx);

  for (const balanceType of [PUBLIC, PRIVATE]) {
    const destination = balanceType === PUBLIC ? PRIVATE : PUBLIC;

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Self transfer from ${balanceType} to ${destination} balance`,
      { tag: aleoTags, annotation: { type: "TMS", description: "B2CQA-XXXX" } },
      async ({ app }) => {
        // The self-transfer target needs the private balance, which only the private sync fetches.
        await openSendFromBalance(app, tx, PRIVATE);
        if (balanceType === PUBLIC) {
          await app.newSendFlow.goBack();
          await app.newSendFlow.selectBalanceType(PUBLIC);
        }

        await app.newSendFlow.clickSelfTransfer();
        await signAndExpectSent(app, tx);
      },
    );
  }
});
