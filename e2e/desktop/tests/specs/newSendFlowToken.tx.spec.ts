import { test } from "tests/fixtures/common";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { NewSendFlowEntry, registerNewSendFlowTests } from "tests/utils/newSendFlowUtils";

const tokenSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction(
      TokenAccount.BASE_AERODROME_1,
      TokenAccount.BASE_AERODROME_2,
      "0.000001",
    ),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction(TokenAccount.ALGO_USDT_1, TokenAccount.ALGO_USDT_2, "0.01"),
    xrayTicket: "B2CQA-6111",
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
  },
];

test.describe("New Send Flow - Token Send", () => {
  registerNewSendFlowTests(tokenSendTransactions);
});
