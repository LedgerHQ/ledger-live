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
import { addTmsLink, getDescription } from "tests/utils/allureUtils";
import {
  FF_LWD_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { NEW_SEND_FLOW_FAMILIES } from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

/** Spare contact addresses: never sent to, they only make the "Select address" sheet open. */
export const EVM_SPARE_ADDRESS = "0x000000000000000000000000000000000000dEaD";
/** Tron black-hole address. */
export const TRON_SPARE_ADDRESS = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";

type BaseEntry = {
  transaction: Transaction;
  xrayTicket: string;
  teamOwner?: Team;
};

export type SendViaContactEntry = BaseEntry & {
  /** `EVM_SPARE_ADDRESS` / `TRON_SPARE_ADDRESS`, or any other address on the sending network. */
  spareAddress: string;
};

/** An ENS-bearing credited account adds an ENS input to the check. */
export type ContactRetrievalEntry = BaseEntry;

export type AddContactAvailabilityEntry = BaseEntry & {
  /** True when the coin's family is listed in `lwdContacts.eligibleAddressFamilies`. */
  isAddressBookSupported: boolean;
};

const FEATURE_FLAGS = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_LWD_CONTACTS_ENABLED,
  newSendFlow: {
    enabled: true,
    params: { families: NEW_SEND_FLOW_FAMILIES },
  },
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

function useSendFlowFixture(entry: BaseEntry) {
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

function testOptions(entry: BaseEntry) {
  return {
    tag: buildTags({ currencyId: entry.transaction.accountToDebit.currency.id }),
    annotation: { type: "TMS", description: entry.xrayTicket },
  };
}

async function linkTms() {
  await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
}

export function registerSendViaContactTests(entries: SendViaContactEntry[]) {
  for (const entry of entries) registerSendViaContact(entry);
}

function registerSendViaContact(entry: SendViaContactEntry) {
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
          await linkTms();

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

export function registerContactRetrievalTests(entries: ContactRetrievalEntry[]) {
  for (const entry of entries) registerContactRetrieval(entry);
}

function registerContactRetrieval(entry: ContactRetrievalEntry) {
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
        `[${tx.accountToDebit.currency.testLabel}] - Contact retrieval on the recipient step`,
        testOptions(entry),
        async ({ app }) => {
          await linkTms();

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
        },
      );
    });
  });
}

export function registerAddContactAvailabilityTests(entries: AddContactAvailabilityEntry[]) {
  for (const entry of entries) registerAddContactAvailability(entry);
}

function registerAddContactAvailability(entry: AddContactAvailabilityEntry) {
  const tx = entry.transaction;

  test.describe("Send - new flow - Address Book", () => {
    test.describe("Add contact availability", () => {
      useSendFlowFixture(entry);

      test(
        `[${tx.accountToDebit.currency.testLabel}] - Add contact availability on the recipient step`,
        testOptions(entry),
        async ({ app }) => {
          await linkTms();

          await openSendFlow(app, tx);

          await app.newSendFlow.typeAddress(recipientAddress(tx));
          await app.newSendFlow.expectAddContactAvailability(entry.isAddressBookSupported);
        },
      );
    });
  });
}
