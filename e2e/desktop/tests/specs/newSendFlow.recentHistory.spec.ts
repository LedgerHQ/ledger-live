import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { openNewSendFromAccount } from "tests/utils/newSendFlowUtils";
import { buildTags } from "tests/utils/tagsUtils";

const newSendFlowFeatureFlags = {
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
  ...FF_NEW_SEND_FLOW_ENABLED,
};

test.describe("Send - new flow - recent history warning", () => {
  const tx = new Transaction(Account.ETH_1, Account.EMPTY, "0.0001");

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataCommand(tx.accountToDebit)],
    featureFlags: newSendFlowFeatureFlags,
  });

  test(
    `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow) recent history warning for a new recipient`,
    {
      tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
      annotation: { type: "TMS", description: "B2CQA-6027" },
    },
    async ({ app }) => {
      await openNewSendFromAccount(app, tx);
      await app.newSendFlow.typeAddress(Addresses.VITALIK_ENS);
      await app.newSendFlow.expectRecentHistoryWarning();
    },
  );
});
