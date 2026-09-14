import invariant from "invariant";
import { generateContactName } from "@ledgerhq/live-e2e-shared/contacts";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import {
  LEDGER_SYNC_FEATURE_FLAGS,
  cleanupLedgerSyncAfterAll,
  setupLedgerSyncSeed,
} from "@e2e/helpers/ledgerSyncHelpers";
import { FF_LWM_CONTACTS_ENABLED, FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

const CONTACT_ADDRESS_LABEL = "Main";

/**
 * Boots the app already a member of a freshly created trustchain (Contacts require Ledger Sync to
 * be "ready"), while the phone runs the transaction's own currency app for the real send: the CLI
 * needs the LedgerSync app only to create the trustchain, so it runs there and switches back.
 */
async function initApp(transaction: TransactionType) {
  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    // Skips the one-time Contacts feature introduction sheet, which otherwise intercepts the
    // first "Add contact" tap on the recipient step (see e2e/mobile/userdata/contacts.json).
    userdata: "contacts",
    featureFlags: {
      ...FF_NEW_SEND_FLOW_ENABLED,
      ...FF_LWM_CONTACTS_ENABLED,
      ...LEDGER_SYNC_FEATURE_FLAGS,
    },
    cliCommandsOnApp: app.ledgerSync
      .initializeEmptyTrustchain()
      .map(cmd => ({ app: AppInfos.LS, cmd })),
    cliCommands: [
      userdataPath => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
      async (userdataPath?: string) => {
        await liveDataWithAddressCommand(transaction.accountToDebit)(userdataPath);
        transaction.accountToCredit.address = await getAccountAddress(transaction.accountToCredit);
        transaction.recipientAddress = transaction.accountToCredit.address;
      },
    ],
  });
  await app.mainNavigation.waitForWallet40Ready();
}

/**
 * B2CQA-6548 (send via contact), B2CQA-6549 (contact retrieval), B2CQA-6550 (add contact
 * availability). Mobile has no shortcut to seed a contact directly the way desktop dispatches a
 * redux action (Contacts live in Ledger Sync, not local state), so the first test creates the
 * contact through the same "Add contact" UI the second test then retrieves it with — one trustchain,
 * one contact, reused across both, the same way the Contacts suite chains create/rename/delete in a
 * single run.
 */
export function runNewSendFlowContactsTest(
  transaction: TransactionType,
  spareAddress: string,
  tmsLinks: string[],
  tags: string[],
) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));

  const contactName = generateContactName();
  const label = transaction.accountToDebit.currency.testLabel;

  describe("Send - new flow - Address Book", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      await initApp(transaction);
    });

    it(`[${label}] - Send (new send flow) via contact`, async () => {
      const recipientAddress = transaction.accountToCredit.address;
      invariant(recipientAddress, "Recipient address is not set");

      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.newSend.typeRecipientNewFlow(recipientAddress);
      await app.newSend.createContactFromRecipientStep(contactName, CONTACT_ADDRESS_LABEL);

      // Retyped rather than assumed carried over: proves the address alone now resolves the contact.
      await app.newSend.clearRecipientNewFlow();
      await app.newSend.typeRecipientNewFlow(recipientAddress);
      await app.newSend.expectMatchedContactCard(contactName);
      await app.newSend.confirmMatchedContact();

      await app.newSend.setAmountAndReviewNewFlow(transaction.amount);
      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.newSend.tapViewTransaction();

      await app.operationDetails.waitForOperationDetails();
      await app.operationDetails.checkAccount(transaction.accountToDebit.accountName);
      await app.operationDetails.checkRecipientAddress(transaction.accountToCredit);
      await app.operationDetails.checkTransactionType("OUT");
    });

    it(`[${label}] - Contact retrieval and Add contact availability on the recipient step`, async () => {
      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);

      // Retrieval by name: the recipient card matches the same way it did by address.
      await app.newSend.typeRecipientNewFlow(contactName);
      await app.newSend.expectMatchedContactCard(contactName);
      await app.newSend.confirmMatchedContact();
      await app.newSend.expectAmountStepContact(contactName);

      // Rides along rather than booting the app again: Add contact only shows for a recipient
      // that is not already a contact, which the spare address gives us.
      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.newSend.typeRecipientNewFlow(spareAddress);
      await app.newSend.expectAddContactEnabled();
    });
  });
}
