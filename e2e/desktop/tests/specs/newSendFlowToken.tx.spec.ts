import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  NewSendFlowEntry,
  NEW_SEND_FLOW_FAMILIES,
  sendWithNewSendFlow,
} from "tests/utils/newSendFlowUtils";
import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const tokenSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction(
      TokenAccount.BASE_AERODROME_1,
      TokenAccount.BASE_AERODROME_2,
      "0.000001",
    ),
    xrayTicket: "B2CQA-6111",
    verifyOperationAmount: true,
  },
  {
    transaction: new Transaction(TokenAccount.ALGO_USDT_1, TokenAccount.ALGO_USDT_2, "0.01"),
    xrayTicket: "B2CQA-6111",
    teamOwner: Team.BST,
  },
  {
    transaction: new Transaction(TokenAccount.SOL_GIGA_1, TokenAccount.SOL_GIGA_2, "0.00001"),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction(TokenAccount.XLM_USDC, TokenAccount.XLM_USDC_3, "0.01"),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "0.01"),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01"),
    xrayTicket: "B2CQA-6111",
    verifyOperationAmount: true,
  },
  {
    transaction: new Transaction(TokenAccount.ETH_WGNK_1, TokenAccount.ETH_WGNK_3, "0.123456789"),
    xrayTicket: "B2CQA-6111",
    verifyAmountPrecision: true,
    verifyOperationAmount: true,
  },
];

for (const entry of tokenSendTransactions) {
  const tx = entry.transaction;

  test.describe("Send - new flow", () => {
    test.use({
      teamOwner: entry.teamOwner ?? Team.COIN_INTEGRATION,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: tx.accountToDebit.currency.speculosApp,
      cliCommands: [liveDataWithRecipientAddressCommand(tx)],
      featureFlags: {
        ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
        newSendFlow: { enabled: true, params: { families: NEW_SEND_FLOW_FAMILIES } },
      },
    });

    test(
      `[${tx.accountToDebit.currency.testLabel}] - Send (new send flow)${
        tx.accountToDebit.derivationMode ? ` - ${tx.accountToDebit.derivationMode}` : ""
      }`,
      {
        tag: buildTags({ currencyId: tx.accountToDebit.currency.id }),
        annotation: [{ type: "TMS", description: entry.xrayTicket }],
      },
      async ({ app }) => {
        await sendWithNewSendFlow(app, entry);
      },
    );
  });
}
