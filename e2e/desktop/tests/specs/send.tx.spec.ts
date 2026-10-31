import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { ownedBy } from "tests/utils/allureUtils";
import {
  getAccountAddress,
  liveDataCommand,
  liveDataWithRecipientAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { shareViewKeyCommand } from "@ledgerhq/live-e2e-shared/families/aleo";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import { FF_NEW_SEND_FLOW_DISABLED } from "tests/utils/featureFlagUtils";
import { buildTags, shouldSkipLNSTag } from "tests/utils/tagsUtils";
import { skipSharedAccountOnSecondaryLeg } from "tests/utils/sharedAccountUtils";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";

const legacySendTransactions: Array<{
  transaction: Transaction;
  xrayTicket: string;
  postSeedHook?: (userdataPath?: string) => Promise<void>;
  sharedAccountAcrossLegs?: boolean;
}> = [
  {
    transaction: new Transaction(Account.APTOS_1, Account.APTOS_2, "0.0001"),
    xrayTicket: "B2CQA-2920",
  },
  {
    transaction: new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2"),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction(Account.ZEC_1, Account.ZEC_2, "0.001"),
    xrayTicket: "B2CQA-4299",
  },
  {
    transaction: new Transaction(Account.HEDERA_1, Account.HEDERA_2, "0.00001", undefined, "noTag"),
    xrayTicket: "B2CQA-4284",
  },
  {
    transaction: new Transaction(Account.ALEO_1, Account.ALEO_2, "0.000001"),
    xrayTicket: "B2CQA-6267",
    postSeedHook: shareViewKeyCommand(Account.ALEO_1),
  },
  {
    // Mina 4 and Mina 5 are kept out of the staking pool, so a broadcasting night never sends two
    // transactions from one account. Mobile sends the other way around, to share the fees.
    transaction: new Transaction(Account.MINA_4, Account.MINA_5, "0.01"),
    xrayTicket: "B2CQA-4778",
    sharedAccountAcrossLegs: true,
  },
];

const legacyBst = ownedBy(Team.BST, { folder: TestFolder.LEGACY_TESTS });

for (const entry of legacySendTransactions) {
  const tx = entry.transaction;
  const sendLock = exclusiveLockFor({ broadcastAccounts: [tx.accountToDebit] });
  const owner = ownedBy(coinTeamOwner(tx.accountToDebit.currency.id), {
    folder: TestFolder.LEGACY_TESTS,
  });

  test.describe("Send - legacy families", { lock: sendLock.names, ...owner }, () => {
    if (entry.sharedAccountAcrossLegs) {
      skipSharedAccountOnSecondaryLeg(`${tx.accountToDebit.currency.testLabel} send`);
    }

    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [
        liveDataWithRecipientAddressCommand(tx, {
          postSeedHook: entry.postSeedHook,
        }),
      ],
      featureFlags: FF_NEW_SEND_FLOW_DISABLED,
      ...sendLock.fixtures,
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send`,
      {
        tag: buildTags({
          currencyId: tx.accountToDebit.currency.id,
          skipLNS: shouldSkipLNSTag(tx.accountToDebit.currency.id),
        }),
        annotation: { type: "TMS", description: entry.xrayTicket },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
        await app.account.clickSend();
        await app.send.craftTx(tx);
        await app.send.continueAmountModal();
        await app.send.expectTxInfoValidity(tx);
        await app.send.clickContinueToDevice();
        await app.speculos.signSendTransaction(tx);
        await app.send.expectTxSent();
        await app.account.navigateToViewDetails();
        await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
      },
    );
  });
}

test.describe("Send - legacy families - invalid amount", legacyBst, () => {
  const tx = new Transaction(Account.HEDERA_1, Account.HEDERA_2, "100000", undefined, "noTag");

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    featureFlags: FF_NEW_SEND_FLOW_DISABLED,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send - invalid amount (${tx.amount})`,
    {
      tag: buildTags({
        currencyId: tx.accountToDebit.currency.id,
        skipLNS: shouldSkipLNSTag(tx.accountToDebit.currency.id),
      }),
      annotation: { type: "TMS", description: "B2CQA-4287" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
      await app.account.clickSend();
      await app.send.craftTx(tx);
      await app.send.checkContinueButtonDisabled();
      await app.send.checkErrorMessage("Sorry, insufficient funds");
    },
  );
});

test.describe("Send - legacy families - invalid address", legacyBst, () => {
  const tx = new Transaction(Account.HEDERA_1, Account.HEDERA_1, "0.00001", undefined, "noTag");
  let recipientAddress: string | undefined;

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [
      async (userdataPath?: string) => {
        await liveDataCommand(tx.accountToDebit)(userdataPath);
        recipientAddress = await getAccountAddress(tx.accountToCredit);
        return recipientAddress;
      },
    ],
    featureFlags: FF_NEW_SEND_FLOW_DISABLED,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send - invalid address - same as sender`,
    {
      tag: buildTags({
        currencyId: tx.accountToDebit.currency.id,
        skipLNS: shouldSkipLNSTag(tx.accountToDebit.currency.id),
      }),
      annotation: { type: "TMS", description: "B2CQA-4282" },
    },
    async ({ app }) => {
      if (!recipientAddress) {
        throw new Error(`Missing recipient address for ${tx.accountToCredit.accountName}`);
      }
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
      await app.account.clickSend();
      await app.send.fillRecipient(recipientAddress);
      await app.send.checkErrorMessage("Recipient address is the same as the sender address");
      await app.send.checkContinueButtonDisabled();
    },
  );
});

const concordiumLock = exclusiveLockFor({ broadcastAccounts: [Account.CCD_TESTNET_1] });
const concordiumDetails = { lock: concordiumLock.names, ...legacyBst };

test.describe("Send - legacy families - Concordium testnet", concordiumDetails, () => {
  const tx = new Transaction(Account.CCD_TESTNET_1, Account.CCD_TESTNET_2, "0.000005", undefined);

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    ...concordiumLock.fixtures,
    cliCommands: [
      async (userdataPath?: string) => {
        await liveDataCommand(tx.accountToDebit, {
          currency: tx.accountToDebit.currency.id,
        })(userdataPath);
        const recipientAddress = await getAccountAddress(tx.accountToCredit);
        tx.accountToCredit.address = recipientAddress;
        tx.recipientAddress = recipientAddress;
        return recipientAddress;
      },
    ],
    featureFlags: {
      ...FF_NEW_SEND_FLOW_DISABLED,
      currencyConcordiumTestnet: { enabled: true },
      analyticsOptIn: { enabled: true, params: { policyVersion: 1 } },
    },
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id, skipLNS: true }),
      annotation: { type: "TMS", description: "B2CQA-6118" },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
      await app.account.clickSend();
      await app.send.craftTx(tx);
      await app.send.continueAmountModal();
      await app.send.expectTxInfoValidity(tx);
      await app.send.clickContinueToDevice();
      await app.speculos.signSendTransaction(tx);
      await app.send.expectTxSent();
      await app.account.navigateToViewDetails();
      await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
    },
  );
});
