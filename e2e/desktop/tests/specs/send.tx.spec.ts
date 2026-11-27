import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
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
  extraTags?: string[];
}> = [
  {
    transaction: new Transaction({
      accountToDebit: Account.ETH_1,
      accountToCredit: Account.ETH_3,
      amount: "0.00001",
      speed: Fee.SLOW,
    }),
    xrayTicket: "B2CQA-3924",
    extraTags: ["@smoke"],
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.APTOS_1,
      accountToCredit: Account.APTOS_2,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-2920",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.KASPA_1,
      accountToCredit: Account.KASPA_2,
      amount: "0.2",
    }),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ZEC_1,
      accountToCredit: Account.ZEC_2,
      amount: "0.001",
    }),
    xrayTicket: "B2CQA-4299",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.HEDERA_1,
      accountToCredit: Account.HEDERA_2,
      amount: "0.00001",
      memoTag: "noTag",
    }),
    xrayTicket: "B2CQA-4284",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ALEO_1,
      accountToCredit: Account.ALEO_2,
      amount: "0.000001",
    }),
    xrayTicket: "B2CQA-6267",
    postSeedHook: shareViewKeyCommand(Account.ALEO_1),
  },
  {
    // Mina 4 and Mina 5 are kept out of the staking pool, so a broadcasting night never sends two
    // transactions from one account. Mobile sends the other way around, to share the fees.
    transaction: new Transaction({
      accountToDebit: Account.MINA_4,
      accountToCredit: Account.MINA_5,
      amount: "0.01",
    }),
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
          extraTags: entry.extraTags,
        }),
        annotation: { type: "TMS", description: entry.xrayTicket },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(tx.accountToDebit.accountName);
        await app.account.clickSend(tx.accountToDebit.currency);
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

const concordiumLock = exclusiveLockFor({ broadcastAccounts: [Account.CCD_TESTNET_1] });
const concordiumDetails = { lock: concordiumLock.names, ...legacyBst };

test.describe("Send - legacy families - Concordium testnet", concordiumDetails, () => {
  const tx = new Transaction({
    accountToDebit: Account.CCD_TESTNET_1,
    accountToCredit: Account.CCD_TESTNET_2,
    amount: "0.000005",
  });

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
      await app.account.clickSend(tx.accountToDebit.currency);
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
