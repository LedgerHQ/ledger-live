import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { AmountQuickAction } from "@ledgerhq/live-e2e-shared/enum/AmountQuickAction";
import { EIP1559_CUSTOM_FEES, EIP1559_HIGH_MAX_FEE, Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { SendScenario, sendFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { ownedBy } from "tests/utils/allureUtils";
import {
  accountAddressCommand,
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
  requireAccountAddress,
  requireRecipientAddress,
} from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { getSavedSpendableBalance } from "tests/utils/userdata";

const newSendFlowFeatureFlags = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_NEW_SEND_FLOW_ENABLED,
};

const invalidAmounts: Array<{
  transaction: Transaction;
  expectedErrorMessage: string | null;
  xrayTicket: string;
  // Insufficient funds errors are the only ones routed to the "Get <ticker>" CTA.
  expectsGetFundsCta?: boolean;
}> = [
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_3, "0.1", undefined, "noTag"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 XRP to activate it",
    xrayTicket: "B2CQA-2571",
    expectsGetFundsCta: true,
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
    xrayTicket: "B2CQA-2570",
    // Buy lists "polkadot", not "assethub_polkadot": no Get DOT CTA, Review stays disabled.
    expectsGetFundsCta: false,
  },
];

for (const entry of invalidAmounts) {
  const tx = entry.transaction;

  const owner = ownedBy(coinTeamOwner(tx.accountToDebit.currency.id), {
    folder: sendFolder(tx.accountToDebit),
    scenario: SendScenario.INVALID_AMOUNT,
  });

  test.describe("Send - new flow - invalid amount", owner, () => {
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(tx)],
      featureFlags: newSendFlowFeatureFlags,
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send - invalid amount (${tx.amount || "empty"})`,
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

const ethSendFlow = (scenario: SendScenario) =>
  ownedBy(coinTeamOwner(Account.ETH_1.currency.id), {
    folder: sendFolder(Account.ETH_1),
    scenario,
  });

test.describe("Send - new flow - max amount", ethSendFlow(SendScenario.MAX_AMOUNT), () => {
  const tx = new Transaction(Account.ETH_1, Account.ETH_2, "send max", Fee.MEDIUM);

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    env: { DISABLE_TRANSACTION_BROADCAST: "1" },
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send - quick actions, max amount and device lost during signature`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-6124, B2CQA-6028, B2CQA-115" },
    },
    async ({ app, speculos, userdataFile }) => {
      await app.layout.syncAccountsAndWaitForSync();
      await reachAmountStep(app, tx);
      const spendableBalance = await getSavedSpendableBalance(userdataFile, tx.accountToDebit);
      for (const action of Object.values(AmountQuickAction)) {
        await app.newSendFlow.clickQuickAction(action);
        await app.newSendFlow.expectQuickActionAmount(action, spendableBalance);
      }
      await app.newSendFlow.expectInputModeToggleKeepsAmount();

      const threeQuartersAmount = await app.newSendFlow.getCryptoAmount();
      await app.newSendFlow.selectMaxAmount();
      await app.newSendFlow.expectCryptoAmountGreaterThan(threeQuartersAmount);
      await app.newSendFlow.expectReviewEnabled();

      await app.newSendFlow.clickReview();
      await app.newSendFlow.waitForSignature();
      await app.speculos.waitForSendReview(tx);
      await speculos.stop();
      await app.newSendFlow.expectDeviceDisconnectedError();
    },
  );
});

const btcFeeStrategy = ownedBy(coinTeamOwner(Account.BTC_NATIVE_SEGWIT_1.currency.id), {
  folder: sendFolder(Account.BTC_NATIVE_SEGWIT_1),
  scenario: SendScenario.FEE_STRATEGY,
});

test.describe("Send - new flow - fee strategy", btcFeeStrategy, () => {
  const tx = new Transaction(Account.BTC_NATIVE_SEGWIT_1, Account.BTC_NATIVE_SEGWIT_2, "0.00001");

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx, { useScheme: true })],
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send - fee presets, custom fees and coin control`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-2368, B2CQA-6036" },
    },
    async ({ app }) => {
      await reachAmountStep(app, tx);
      await app.newSendFlow.switchToCryptoInput();
      await app.newSendFlow.selectMaxAmount();

      await app.newSendFlow.selectFeePreset(Fee.SLOW);
      const maxAmountWithSlowFee = await app.newSendFlow.getCryptoAmount();
      await app.newSendFlow.selectFeePreset(Fee.FAST);
      await app.newSendFlow.expectCryptoAmountLowerThan(maxAmountWithSlowFee);

      await app.newSendFlow.fillCryptoAmount(tx.amount);
      await app.newSendFlow.openFeesMenu();
      await app.newSendFlow.expectBitcoinFeesMenuOptions();
      await app.newSendFlow.selectCoinControlFromMenu();
      await app.newSendFlow.expectCoinControlScreen();
      await app.newSendFlow.goBack();
      await app.newSendFlow.expectAmountStepVisible();

      await app.newSendFlow.openFeesMenu();
      await app.newSendFlow.selectCustomFeesFromMenu();
      await app.newSendFlow.expectCustomFeePerByteScreen();
    },
  );
});

test.describe(
  "Send - new flow - self-transfer and custom fees",
  ethSendFlow(SendScenario.FEE_STRATEGY),
  () => {
    const tx = new Transaction(Account.ETH_1, Account.ETH_3, "0.0001");
    tx.expectedFee = EIP1559_CUSTOM_FEES.expectedNetworkFee;

    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [
        liveDataWithRecipientAddressCommand(tx),
        accountAddressCommand(tx.accountToDebit),
      ],
      env: { DISABLE_TRANSACTION_BROADCAST: "1" },
      featureFlags: newSendFlowFeatureFlags,
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send - self-transfer and custom fees`,
      {
        tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
        annotation: { type: "TMS", description: "B2CQA-6034" },
      },
      async ({ app }) => {
        const senderAddress = requireAccountAddress(tx.accountToDebit);
        const recipientAddress = requireRecipientAddress(tx);

        await openNewSendFromAccount(app, tx);
        await app.newSendFlow.typeAddress(senderAddress);
        await app.newSendFlow.expectAddressMatched(senderAddress);
        await app.newSendFlow.clickOnSendToButton(tx.accountToDebit);
        await app.newSendFlow.expectAmountStepVisible();
        await app.newSendFlow.goBack();

        await app.newSendFlow.typeAddress(recipientAddress);
        await app.newSendFlow.expectAddressMatched(recipientAddress);
        await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
        await app.newSendFlow.expectFeePreset(Fee.MEDIUM);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        await app.newSendFlow.expectFeePreset(Fee.MEDIUM);
        await app.newSendFlow.selectFeePreset(Fee.SLOW);
        await app.newSendFlow.expectFeePreset(Fee.SLOW);
        await app.newSendFlow.selectFeePreset(Fee.FAST);
        await app.newSendFlow.expectFeePreset(Fee.FAST);

        await app.newSendFlow.openFeesMenu();
        await app.newSendFlow.expectEvmFeesMenuOptions();
        await app.newSendFlow.selectCustomFeesFromMenu();
        await app.newSendFlow.expectEip1559CustomFeesPrefilled();
        const prefilledFiatFee = await app.newSendFlow.getCustomFeesFiatValue();
        await app.newSendFlow.fillEip1559MaxFee(EIP1559_HIGH_MAX_FEE);
        await app.newSendFlow.expectCustomFeesFiatValueChanged(prefilledFiatFee);
        await app.newSendFlow.fillEip1559CustomFees(EIP1559_CUSTOM_FEES);
        await app.newSendFlow.confirmCustomFees();
        await app.newSendFlow.expectCustomFeesApplied();
        await app.newSendFlow.expectNetworkFee(
          EIP1559_CUSTOM_FEES.expectedNetworkFee,
          tx.accountToDebit.currency.ticker,
        );
        await app.newSendFlow.clickReview();
        await app.newSendFlow.waitForSignature();
        await app.speculos.signSendTransaction(tx);
        await app.newSendFlow.waitForSuccessConfirmation();
        await app.newSendFlow.clickViewDetails();
        await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
      },
    );
  },
);

const invalidAddresses: Array<{
  transaction: Transaction;
  address?: string;
  expectedErrorMessage: string | null;
  scenario: string;
  xrayTicket: string;
}> = [
  {
    transaction: new Transaction(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.00001", Fee.MEDIUM),
    address: Addresses.BTC_NATIVE_SEGWIT_1,
    expectedErrorMessage: null,
    scenario: "incorrect format",
    xrayTicket: "B2CQA-2709",
  },
];

for (const entry of invalidAddresses) {
  const tx = entry.transaction;
  let recipientAddress = entry.address;

  const owner = ownedBy(coinTeamOwner(tx.accountToDebit.currency.id), {
    folder: sendFolder(tx.accountToDebit),
    scenario: SendScenario.INVALID_ADDRESS,
  });

  test.describe("Send - new flow - invalid address", owner, () => {
    test.use({
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
      `[${tx.accountToDebit.currency.testLabel}] - Send - invalid address - ${entry.scenario}`,
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

test.describe("Send - new flow - ENS address", ethSendFlow(SendScenario.ENS_ADDRESS), () => {
  const tx = new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001", Fee.MEDIUM);

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    env: { DISABLE_TRANSACTION_BROADCAST: "1" },
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send - ENS address`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-2202, B2CQA-6027" },
    },
    async ({ app }) => {
      await openNewSendFromAccount(app, tx);
      await app.newSendFlow.typeAddress(Addresses.VITALIK_ENS);
      await app.newSendFlow.expectRecentHistoryWarning();
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
