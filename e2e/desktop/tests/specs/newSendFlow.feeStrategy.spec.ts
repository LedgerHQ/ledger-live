import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { reachAmountStep } from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

test.describe("Send - new flow - fee strategy", () => {
  const tx = new Transaction(Account.BTC_NATIVE_SEGWIT_1, Account.BTC_NATIVE_SEGWIT_2, "0.00001");

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx, { useScheme: true })],
    featureFlags: {
      ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
      ...FF_NEW_SEND_FLOW_ENABLED,
    },
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) fee presets, custom fees and coin control`,
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
