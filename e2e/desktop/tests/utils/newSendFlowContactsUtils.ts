import invariant from "invariant";
import { getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  buildSeededContacts,
  generateContactName,
  type ContactSeed,
} from "@ledgerhq/live-e2e-shared/contacts";
import { test } from "tests/fixtures/common";
import { Application } from "tests/page";
import {
  FF_LWD_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { type NewSendFlowEntry } from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

export type ContactsEntry = NewSendFlowEntry & {
  /**
   * A second address on the sending network: seeded as the contact's spare address so the
   * "Select address" sheet opens, left unseeded where an unknown recipient is needed.
   */
  spareAddress: string;
};

const FEATURE_FLAGS = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_LWD_CONTACTS_ENABLED,
  ...FF_NEW_SEND_FLOW_ENABLED,
};

/** `test.use` replaces the fixture's settings, so its analytics defaults are restated here. */
const SETTINGS = {
  shareAnalytics: false,
  hasSeenAnalyticsOptInPrompt: true,
  hasDismissedContactsFeatureIntroduction: true,
};

/** Seeded into the running store: the db middleware clobbers a userdata seed before `fetchWallet` reads it. */
async function seedContacts(app: Application, seeds: readonly ContactSeed[]) {
  await app.redux.dispatch({
    type: "contacts/setContacts",
    payload: buildSeededContacts(seeds),
  });
}

async function openSendFlow(app: Application, tx: Transaction) {
  await app.mainNavigation.openTargetFromMainNavigation("accounts");
  await app.accounts.navigateToAccountByName(getParentAccountName(tx.accountToDebit));
  await app.account.clickSend();
  await app.newSendFlow.waitForDialog();
}

/** Resolved by `liveDataWithRecipientAddressCommand`, so only after the CLI ran. */
function recipientAddress(tx: Transaction): string {
  const address = tx.accountToCredit.address;
  invariant(
    address,
    `Missing recipient address for ${tx.accountToCredit.accountName}. ` +
      `Ensure the CLI setup populates the address.`,
  );
  return address;
}

function useSendFlowFixture(entry: ContactsEntry) {
  const tx = entry.transaction;
  test.use({
    teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    settings: SETTINGS,
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    featureFlags: FEATURE_FLAGS,
  });
}

function testOptions(entry: ContactsEntry) {
  return {
    tag: buildTags({ currencyId: entry.transaction.accountToDebit.currency.id }),
    annotation: { type: "TMS", description: entry.xrayTicket },
  };
}

export function registerSendViaContactTests(entries: ContactsEntry[]) {
  for (const entry of entries) {
    const tx = entry.transaction;

    test.describe("Send - new flow - Address Book", () => {
      test.describe("Send via contact", () => {
        const contact = {
          id: "e2e-contact-multi-address",
          name: generateContactName(),
          mainAddressId: "e2e-address-main",
        };
        /** Two addresses on the sending network, so the "Select address" sheet opens. */
        const seed = (): ContactSeed[] => [
          {
            id: contact.id,
            name: contact.name,
            addresses: [
              {
                id: contact.mainAddressId,
                currencyId: tx.accountToCredit.currency.id,
                label: "Main",
                address: recipientAddress(tx),
              },
              {
                id: "e2e-address-spare",
                currencyId: tx.accountToCredit.currency.id,
                label: "Spare",
                address: entry.spareAddress,
              },
            ],
          },
        ];

        useSendFlowFixture(entry);

        test(
          `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) via contact`,
          testOptions(entry),
          async ({ app }) => {
            await seedContacts(app, seed());
            await openSendFlow(app, tx);

            await app.newSendFlow.selectContact(contact.id);
            await app.newSendFlow.selectContactAddress(contact.mainAddressId);
            await app.newSendFlow.expectAmountStepContact(contact.name);

            await app.newSendFlow.fillCryptoAmount(tx.amount);
            if (tx.speed) {
              await app.newSendFlow.selectFeePreset(tx.speed);
            }
            await app.newSendFlow.clickReview();

            await app.newSendFlow.waitForSignature();
            await app.speculos.signSendTransaction(tx);
            await app.newSendFlow.waitForSuccessConfirmation();

            await app.newSendFlow.clickViewDetails();
            await app.sendDrawer.addressValueIsVisible(recipientAddress(tx));
          },
        );
      });
    });
  }
}

export function registerContactRetrievalTests(entries: ContactsEntry[]) {
  for (const entry of entries) {
    const tx = entry.transaction;

    test.describe("Send - new flow - Address Book", () => {
      test.describe("Contact retrieval", () => {
        const contact = {
          id: "e2e-contact-single-address",
          name: generateContactName(),
        };
        const seed = (): ContactSeed[] => [
          {
            id: contact.id,
            name: contact.name,
            addresses: [
              {
                id: "e2e-address-main",
                currencyId: tx.accountToCredit.currency.id,
                label: "Main",
                address: recipientAddress(tx),
              },
            ],
          },
        ];

        useSendFlowFixture(entry);

        test(
          `[${tx.accountToDebit.currency.testLabel}] - Contact retrieval and Add contact availability on the recipient step`,
          testOptions(entry),
          async ({ app }) => {
            const ensName = tx.accountToCredit.ensName;
            const recipientInputs = [
              recipientAddress(tx),
              ...(ensName ? [ensName] : []),
              contact.name,
            ];

            await seedContacts(app, seed());
            await openSendFlow(app, tx);

            // Cleared between inputs so a stale card cannot satisfy the next assertion.
            for (const recipientInput of recipientInputs) {
              await app.newSendFlow.typeAddress(recipientInput);
              await app.newSendFlow.expectMatchedContact(contact.name);
              await app.newSendFlow.clearRecipient();
            }

            // Rides along rather than booting app + Speculos again: the Add contact action needs
            // a recipient that is not already a contact, which the spare address gives us.
            await app.newSendFlow.typeAddress(entry.spareAddress);
            await app.newSendFlow.expectAddContactEnabled();
          },
        );
      });
    });
  }
}
