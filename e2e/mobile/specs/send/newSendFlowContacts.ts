import invariant from "invariant";
import {
  buildSeededContacts,
  generateContactName,
  type ContactSeed,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import type { Contact } from "@domain/entity-contact";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { importContacts } from "@e2e/bridge/server";
import { FF_LWM_CONTACTS_ENABLED, FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";

const SEND_VIA_CONTACT_MAIN_ADDRESS_ID = "e2e-send-via-contact-main";

type Contacts = { sendViaContact: ContactSeed; retrieval: ContactSeed };

function buildContacts(transaction: TransactionType, retrievalAddress: string): Contacts {
  const recipientAddress = transaction.accountToCredit.address;
  const neverSelectedSecondAddress = transaction.accountToDebit.address;
  invariant(recipientAddress, "Recipient address is not set");
  invariant(neverSelectedSecondAddress, "Debit account address is not set");
  const currencyId = transaction.accountToCredit.currency.id;

  return {
    sendViaContact: {
      id: "e2e-contact-send-via-contact",
      name: generateContactName(),
      addresses: [
        {
          id: SEND_VIA_CONTACT_MAIN_ADDRESS_ID,
          currencyId,
          label: "Main",
          address: recipientAddress,
        },
        {
          id: "e2e-send-via-contact-spare",
          currencyId,
          label: "Spare",
          address: neverSelectedSecondAddress,
        },
      ],
    },
    retrieval: {
      id: "e2e-contact-retrieval",
      name: generateContactName(),
      addresses: [
        { id: "e2e-retrieval-main", currencyId, label: "Main", address: retrievalAddress },
      ],
    },
  };
}

async function initApp(
  transaction: TransactionType,
  retrievalAccount: Account | TokenAccount,
): Promise<Contacts> {
  let retrievalAddress: string | undefined;

  await app.init({
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    userdata: "contacts",
    featureFlags: {
      ...FF_NEW_SEND_FLOW_ENABLED,
      ...FF_LWM_CONTACTS_ENABLED,
    },
    cliCommands: [
      async (userdataPath?: string) => {
        await liveDataWithAddressCommand(transaction.accountToDebit)(userdataPath);
        transaction.accountToCredit.address = await getAccountAddress(transaction.accountToCredit);
        transaction.recipientAddress = transaction.accountToCredit.address;
        retrievalAddress = await getAccountAddress(retrievalAccount);
      },
    ],
  });
  await app.mainNavigation.waitForWallet40Ready();

  invariant(retrievalAddress, "Retrieval account address is not set");
  const contacts = buildContacts(transaction, retrievalAddress);
  const seeded = buildSeededContacts([contacts.sendViaContact, contacts.retrieval]) as Contact[];
  await importContacts(seeded);

  return contacts;
}

export function runNewSendFlowContactsTest(
  transaction: TransactionType,
  spareAddress: string,
  retrievalAccount: Account | TokenAccount,
  tmsLinks: string[],
  tags: string[],
) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));

  const label = transaction.accountToDebit.currency.testLabel;
  let contacts: Contacts;

  describe("Send - new flow - Address Book", () => {
    beforeAll(async () => {
      contacts = await initApp(transaction, retrievalAccount);
    });

    it(`[${label}] - Send (new send flow) via contact`, async () => {
      const { sendViaContact } = contacts;

      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);
      await app.newSend.typeRecipientNewFlow(sendViaContact.name);
      await app.newSend.selectContactFromSearchResults(sendViaContact.id);
      await app.newSend.selectContactAddress(SEND_VIA_CONTACT_MAIN_ADDRESS_ID);
      await app.newSend.expectAmountStepContact(sendViaContact.name);

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
      const { retrieval } = contacts;
      const retrievalAddress = retrieval.addresses[0]?.address;
      invariant(retrievalAddress, "Retrieval contact address is not set");

      await app.send.navigateToSendScreen(transaction.accountToDebit.accountName);

      await app.newSend.typeRecipientNewFlow(retrievalAddress);
      await app.newSend.expectMatchedContactCard(retrieval.name);
      await app.newSend.clearRecipientNewFlow();

      await app.newSend.typeRecipientNewFlow(retrieval.name);
      await app.newSend.expectMatchedContactCard(retrieval.name);
      await app.newSend.clearRecipientNewFlow();

      if (retrievalAccount.ensName) {
        await app.newSend.typeRecipientNewFlow(retrievalAccount.ensName);
        await app.newSend.expectMatchedContactCard(retrieval.name);
        await app.newSend.clearRecipientNewFlow();
      }

      await app.newSend.typeRecipientNewFlow(spareAddress);
      await app.newSend.expectAddContactEnabled();
    });
  });
}
