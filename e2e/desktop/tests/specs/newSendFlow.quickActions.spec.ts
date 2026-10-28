import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
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

test.describe("Send - new flow - amount quick actions", () => {
  const tx = new Transaction(Account.ETH_1, Account.ETH_2, "25%");

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
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) 25% quick action`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-6028" },
    },
    async ({ app }) => {
      await reachAmountStep(app, tx);
      await app.newSendFlow.clickQuickAction("quarter");
      await app.newSendFlow.expectAmountFilled();
    },
  );
});
