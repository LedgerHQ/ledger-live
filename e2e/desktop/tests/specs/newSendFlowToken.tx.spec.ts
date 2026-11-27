import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { NewSendFlowEntry, registerNewSendFlowTests } from "tests/utils/newSendFlowUtils";

const tokenSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.BASE_AERODROME_1,
      accountToCredit: TokenAccount.BASE_AERODROME_2,
      amount: "0.000001",
    }),
    xrayTicket: "B2CQA-6111",
    verifyOperationAmount: true,
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.ALGO_USDT_1,
      accountToCredit: TokenAccount.ALGO_USDT_2,
      amount: "0.01",
    }),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.SOL_GIGA_1,
      accountToCredit: TokenAccount.SOL_GIGA_2,
      amount: "0.00001",
    }),
    xrayTicket: "B2CQA-3055",
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.XLM_USDC,
      accountToCredit: TokenAccount.XLM_USDC_3,
      amount: "0.01",
    }),
    xrayTicket: "B2CQA-6111",
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.TRX_USDT,
      accountToCredit: TokenAccount.TRX_USDT_2,
      amount: "0.01",
    }),
    xrayTicket: "B2CQA-6111",
    disableBroadcast: true,
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.ETH_USDT_1,
      accountToCredit: TokenAccount.ETH_USDT_3,
      amount: "0.01",
    }),
    xrayTicket: "B2CQA-6111",
    verifyOperationAmount: true,
  },
  {
    transaction: new Transaction({
      accountToDebit: TokenAccount.ETH_WGNK_1,
      accountToCredit: TokenAccount.ETH_WGNK_3,
      amount: "0.123456789",
    }),
    xrayTicket: "B2CQA-6111",
    verifyAmountPrecision: true,
    verifyOperationAmount: true,
  },
];

registerNewSendFlowTests(tokenSendTransactions);
