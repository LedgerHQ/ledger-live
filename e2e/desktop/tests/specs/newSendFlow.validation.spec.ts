import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  getAccountAddress,
  liveDataCommand,
  liveDataWithRecipientAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import {
  openNewSendFromAccount,
  reachAmountStep,
  requireRecipientAddress,
} from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

const newSendFlowFeatureFlags = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_NEW_SEND_FLOW_ENABLED,
};

const invalidAmounts: Array<{
  transaction: Transaction;
  expectedErrorMessage: string | null;
  xrayTicket: string;
  teamOwner?: Team;
  // Insufficient funds errors are the only ones routed to the "Get <ticker>" CTA.
  expectsGetFundsCta?: boolean;
}> = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2568",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2569",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_3, "0.1", undefined, "noTag"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 XRP to activate it",
    xrayTicket: "B2CQA-2571",
    teamOwner: Team.BST,
    expectsGetFundsCta: true,
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
    xrayTicket: "B2CQA-2570",
    expectsGetFundsCta: true,
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM),
    expectedErrorMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-2572",
    expectsGetFundsCta: true,
  },
];

for (const entry of invalidAmounts) {
  const tx = entry.transaction;

  test.describe("Send - new flow - invalid amount", () => {
    test.use({
      teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(tx)],
      featureFlags: newSendFlowFeatureFlags,
    });

    test(
      `[${
        tx.accountToDebit.currency.testLabel
      }] - Send (new send flow) invalid amount: ${tx.amount || "empty amount"}`,
      {
        tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
        annotation: { type: "TMS", description: entry.xrayTicket },
      },
      async ({ app }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        if (entry.expectedErrorMessage) {
          await app.newSendFlow.expectAmountError(entry.expectedErrorMessage);
        }
        if (entry.expectsGetFundsCta) {
          await app.newSendFlow.expectGetFundsCta();
        } else {
          await app.newSendFlow.expectReviewDisabled();
        }
      },
    );
  });
}

test.describe("Send - new flow - max amount", () => {
  const tx = new Transaction(Account.ETH_1, Account.ETH_2, "send max", Fee.MEDIUM);

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) max amount`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-473" },
    },
    async ({ app }) => {
      await reachAmountStep(app, tx);
      await app.newSendFlow.selectMaxAmount();
      await app.newSendFlow.expectReviewEnabled();
    },
  );
});

const validAddresses: Array<{
  transaction: Transaction;
  testName: string;
  xrayTicket: string;
  teamOwner?: Team;
  // The recipient screen sends the typed value to the bridge, unless a reverse ENS
  // lookup resolves it first: the resolver re-encodes the address in EIP-55, which
  // suppresses the non-checksummed warning. Only accounts without an ENS record can
  // exercise that warning.
  lowercaseAddress?: boolean;
  expectedWarning?: string;
}> = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.MEDIUM),
    testName: "new account",
    xrayTicket: "B2CQA-2714",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0.00001", Fee.MEDIUM),
    testName: "existing account",
    xrayTicket: "B2CQA-2715",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.0001", Fee.MEDIUM),
    testName: "lower case address",
    xrayTicket: "B2CQA-2717",
    lowercaseAddress: true,
    expectedWarning: "Auto-verification not available: carefully verify the address",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "1", undefined, "123456"),
    testName: "with tag",
    xrayTicket: "B2CQA-2718",
    teamOwner: Team.BST,
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "2"),
    testName: "without tag",
    xrayTicket: "B2CQA-2719",
    teamOwner: Team.BST,
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.00001", undefined, "123456"),
    testName: "with tag",
    xrayTicket: "B2CQA-2720",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001"),
    testName: "without tag",
    xrayTicket: "B2CQA-2721",
  },
  {
    transaction: new Transaction(Account.BTC_LEGACY_1, Account.BTC_LEGACY_2, "0.00001", Fee.MEDIUM),
    testName: "legacy",
    xrayTicket: "B2CQA-2722",
  },
  {
    transaction: new Transaction(Account.BTC_SEGWIT_1, Account.BTC_SEGWIT_2, "0.00001", Fee.MEDIUM),
    testName: "segwit",
    xrayTicket: "B2CQA-2723",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    testName: "native segwit",
    xrayTicket: "B2CQA-2724",
  },
  {
    transaction: new Transaction(
      Account.BTC_TAPROOT_1,
      Account.BTC_TAPROOT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    testName: "taproot",
    xrayTicket: "B2CQA-2725",
  },
  {
    transaction: new Transaction(Account.BCH_1, Account.BCH_2, "0.00001", Fee.MEDIUM),
    testName: "cash address",
    xrayTicket: "B2CQA-2726",
  },
];

for (const entry of validAddresses) {
  const tx = entry.transaction;

  test.describe("Send - new flow - valid address", () => {
    test.use({
      teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(tx, { useScheme: true })],
      featureFlags: newSendFlowFeatureFlags,
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) valid address - ${entry.testName}`,
      {
        tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
        annotation: { type: "TMS", description: entry.xrayTicket },
      },
      async ({ app }) => {
        await openNewSendFromAccount(app, tx);
        const checksummed = requireRecipientAddress(tx);
        const typedAddress = entry.lowercaseAddress ? checksummed.toLowerCase() : checksummed;
        await app.newSendFlow.typeAddress(typedAddress);
        await app.newSendFlow.expectAddressMatched(checksummed);
        if (entry.expectedWarning) {
          await app.newSendFlow.expectRecipientWarning(entry.expectedWarning);
        } else {
          await app.newSendFlow.expectRecipientWarningHidden();
        }
      },
    );
  });
}

const invalidAddresses: Array<{
  transaction: Transaction;
  address?: string;
  expectedErrorMessage: string | null;
  xrayTicket: string;
  teamOwner?: Team;
}> = [
  {
    transaction: new Transaction(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.00001", Fee.MEDIUM),
    address: Addresses.BTC_NATIVE_SEGWIT_1,
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2709",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.EMPTY, "0.00001", Fee.MEDIUM),
    address: " ",
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2710",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_1, "0.5"),
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2711",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_1, "1", undefined, "123456"),
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2712",
    teamOwner: Team.BST,
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_1, "0.00001"),
    expectedErrorMessage: "Recipient address is the same as the sender address",
    xrayTicket: "B2CQA-2713",
  },
];

for (const entry of invalidAddresses) {
  const tx = entry.transaction;
  let recipientAddress = entry.address;

  test.describe("Send - new flow - invalid address", () => {
    test.use({
      teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [
        async (userdataPath?: string) => {
          await liveDataCommand(tx.accountToDebit)(userdataPath);
          if (
            tx.accountToCredit !== Account.EMPTY &&
            tx.accountToCredit !== Account.BTC_NATIVE_SEGWIT_1
          ) {
            recipientAddress = await getAccountAddress(tx.accountToCredit);
          }
          return recipientAddress;
        },
      ],
      featureFlags: newSendFlowFeatureFlags,
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) invalid address - ${
        entry.expectedErrorMessage ?? (entry.address?.trim() ? "incorrect format" : "empty")
      }`,
      {
        tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
        annotation: { type: "TMS", description: entry.xrayTicket },
      },
      async ({ app }) => {
        await openNewSendFromAccount(app, tx);
        await app.newSendFlow.typeAddress(recipientAddress ?? "");

        if (entry.expectedErrorMessage) {
          await app.newSendFlow.expectRecipientError(entry.expectedErrorMessage);
        } else if (recipientAddress?.trim()) {
          await app.newSendFlow.expectInvalidAddress();
        } else {
          await app.newSendFlow.expectNoAddressMatched();
        }
      },
    );
  });
}

test.describe("Send - new flow - ENS address", () => {
  const tx = new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001", Fee.MEDIUM);

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    env: { DISABLE_TRANSACTION_BROADCAST: "1" },
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) to ENS address`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-2202" },
    },
    async ({ app }) => {
      await openNewSendFromAccount(app, tx);
      await app.newSendFlow.typeAddress(tx.accountToCredit.ensName ?? "");
      await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
      await app.newSendFlow.fillCryptoAmount(tx.amount);
      await app.newSendFlow.selectFeePreset(Fee.MEDIUM);
      await app.newSendFlow.clickReview();
      await app.newSendFlow.waitForSignature();
      await app.speculos.signSendTransaction(tx);
      await app.newSendFlow.waitForSuccessConfirmation();
      await app.newSendFlow.clickViewDetails();
      await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
    },
  );
});
