import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  ContactsEntry,
  retrieveContact,
  sendViaContact,
} from "tests/utils/newSendFlowContactsUtils";
import { NEW_SEND_FLOW_FAMILIES } from "tests/utils/newSendFlowUtils";
import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  FF_LWD_CONTACTS_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const sendViaContactTransactions: ContactsEntry[] = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    spareAddress: Addresses.EVM_SPARE,
    xrayTicket: "B2CQA-6548",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    spareAddress: Addresses.TRON_SPARE,
    xrayTicket: "B2CQA-6548",
  },
];

/** These also assert Add contact availability on an unknown recipient (the spare address). */
const contactRetrievalTransactions: ContactsEntry[] = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001"),
    spareAddress: Addresses.EVM_SPARE,
    xrayTicket: "B2CQA-6549, B2CQA-6550",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    spareAddress: Addresses.TRON_SPARE,
    xrayTicket: "B2CQA-6549, B2CQA-6550",
  },
];

const featureFlags = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_LWD_CONTACTS_ENABLED,
  newSendFlow: { enabled: true, params: { families: NEW_SEND_FLOW_FAMILIES } },
};

const settings = {
  shareAnalytics: false,
  hasSeenAnalyticsOptInPrompt: true,
  hasDismissedContactsFeatureIntroduction: true,
};

for (const entry of sendViaContactTransactions) {
  const tx = entry.transaction;

  test.describe("Send - new flow - Address Book", () => {
    test.describe("Send via contact", () => {
      test.use({
        teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
        userdata: "skip-onboarding-with-last-seen-device",
        settings,
        speculosApp: tx.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(tx)],
        featureFlags,
      });

      test(
        `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) via contact`,
        {
          tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
          annotation: { type: "TMS", description: entry.xrayTicket },
        },
        async ({ app }) => {
          await sendViaContact(app, entry);
        },
      );
    });
  });
}

for (const entry of contactRetrievalTransactions) {
  const tx = entry.transaction;

  test.describe("Send - new flow - Address Book", () => {
    test.describe("Contact retrieval", () => {
      test.use({
        teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
        userdata: "skip-onboarding-with-last-seen-device",
        settings,
        speculosApp: tx.accountToDebit.currency.speculosApp,
        cliCommands: [liveDataWithRecipientAddressCommand(tx)],
        featureFlags,
      });

      test(
        `[${tx.accountToDebit.currency.testLabel}] - Contact retrieval and Add contact availability on the recipient step`,
        {
          tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
          annotation: { type: "TMS", description: entry.xrayTicket },
        },
        async ({ app }) => {
          await retrieveContact(app, entry);
        },
      );
    });
  });
}
