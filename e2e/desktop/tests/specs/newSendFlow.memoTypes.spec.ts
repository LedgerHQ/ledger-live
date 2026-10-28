import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { StellarMemoType } from "@ledgerhq/live-e2e-shared/enum/MemoType";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { openNewSendFromAccount, requireRecipientAddress } from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

const newSendFlowFeatureFlags = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_NEW_SEND_FLOW_ENABLED,
};

test.describe("Send - new flow - memo types", () => {
  const tx = new Transaction(Account.XLM_1, Account.XLM_2, "0.0001");

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) memo types`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      // TODO: find correct Xray id
      annotation: { type: "TMS", description: "B2CQA-XXX" },
    },
    async ({ app }) => {
      await openNewSendFromAccount(app, tx);
      await app.newSendFlow.typeAddress(requireRecipientAddress(tx));
      await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
      await app.newSendFlow.cancelSkipMemo();
      await app.newSendFlow.expectBackOnRecipientStepWithMemo();

      await app.newSendFlow.expectMemoType(StellarMemoType.MEMO_TEXT);
      await app.newSendFlow.openMemoTypes();
      await app.newSendFlow.expectMemoTypeOptions(Object.values(StellarMemoType));
      await app.newSendFlow.selectMemoType(StellarMemoType.NO_MEMO);
      await app.newSendFlow.expectMemoType(StellarMemoType.NO_MEMO);

      await app.newSendFlow.clickOnSendToButton(tx.accountToCredit);
      await app.newSendFlow.expectAmountStepVisible();
    },
  );
});
