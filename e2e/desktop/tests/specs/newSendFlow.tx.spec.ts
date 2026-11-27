import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  NewSendFlowEntry,
  checkStellarMemoTypes,
  registerNewSendFlowTests,
} from "tests/utils/newSendFlowUtils";
import { shareViewKeyCommand } from "@ledgerhq/live-e2e-shared/families/aleo";

const nativeSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction({
      accountToDebit: Account.DOGE_1,
      accountToCredit: Account.DOGE_2,
      amount: "0.01",
      speed: Fee.SLOW,
    }),
    xrayTicket: "B2CQA-2573",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BCH_1,
      accountToCredit: Account.BCH_2,
      amount: "0.0001",
      speed: Fee.SLOW,
    }),
    xrayTicket: "B2CQA-2808",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ALGO_1,
      accountToCredit: Account.ALGO_2,
      amount: "0.001",
    }),
    xrayTicket: "B2CQA-2810",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.SOL_1,
      accountToCredit: Account.SOL_2,
      amount: "0.000001",
    }),
    xrayTicket: "B2CQA-2811",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.TRX_1,
      accountToCredit: Account.TRX_2,
      amount: "0.01",
    }),
    xrayTicket: "B2CQA-2812",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.XLM_1,
      accountToCredit: Account.XLM_2,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-2813",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.XRP_1,
      accountToCredit: Account.XRP_2,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-2816",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BTC_NATIVE_SEGWIT_1,
      accountToCredit: Account.BTC_NATIVE_SEGWIT_2,
      amount: "0.00001",
      speed: Fee.MEDIUM,
    }),
    xrayTicket: "B2CQA-2724",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ETH_1,
      accountToCredit: Account.ETH_3,
      amount: "0.0001",
      speed: Fee.SLOW,
    }),
    xrayTicket: "B2CQA-3924",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ATOM_1,
      accountToCredit: Account.ATOM_2,
      amount: "0.00001",
    }),
    xrayTicket: "B2CQA-2814",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BTC_LEGACY_1,
      accountToCredit: Account.BTC_LEGACY_2,
      amount: "0.00002",
      speed: Fee.MEDIUM,
    }),
    xrayTicket: "B2CQA-2722",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BTC_SEGWIT_1,
      accountToCredit: Account.BTC_SEGWIT_2,
      amount: "0.00001",
      speed: Fee.MEDIUM,
    }),
    xrayTicket: "B2CQA-2723",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BTC_TAPROOT_1,
      accountToCredit: Account.BTC_TAPROOT_2,
      amount: "0.00001",
      speed: Fee.MEDIUM,
    }),
    xrayTicket: "B2CQA-2725",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.POL_1,
      accountToCredit: Account.POL_2,
      amount: "0.001",
      speed: Fee.SLOW,
    }),
    xrayTicket: "B2CQA-2807",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.DOT_1,
      accountToCredit: Account.DOT_2,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-2809",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ADA_1,
      accountToCredit: Account.ADA_2,
      amount: "1",
    }),
    xrayTicket: "B2CQA-2815",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.SUI_1,
      accountToCredit: Account.SUI_2,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-3802",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.BASE_1,
      accountToCredit: Account.BASE_2,
      amount: "0.000001",
    }),
    xrayTicket: "B2CQA-4225",
    bugTicket: "LIVE-28070",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.VET_1,
      accountToCredit: Account.VET_2,
      amount: "0.1",
    }),
    xrayTicket: "B2CQA-4247",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ICP_1,
      accountToCredit: Account.ICP_2,
      amount: "0.001",
    }),
    xrayTicket: "B2CQA-4742",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.OSMO_1,
      accountToCredit: Account.OSMO_2,
      amount: "0.00001",
    }),
    xrayTicket: "B2CQA-6112",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ALEO_1,
      accountToCredit: Account.ALEO_2,
      amount: "0.000001",
    }),
    xrayTicket: "B2CQA-6267",
    balanceType: "public",
    postSeedHook: shareViewKeyCommand(Account.ALEO_1),
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.XTZ_2,
      accountToCredit: Account.XTZ_1,
      amount: "0.0001",
    }),
    xrayTicket: "B2CQA-6094",
    disableBroadcast: true,
  },
];

const memoSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction({
      accountToDebit: Account.XRP_1,
      accountToCredit: Account.XRP_2,
      amount: "0.0001",
      memoTag: "123456",
    }),
    xrayTicket: "B2CQA-6037",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.XLM_1,
      accountToCredit: Account.XLM_2,
      amount: "0.0001",
      memoTag: "memoText",
    }),
    xrayTicket: "B2CQA-6038",
    recipientStepHook: checkStellarMemoTypes,
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.ATOM_1,
      accountToCredit: Account.ATOM_2,
      amount: "0.00001",
      memoTag: "memo123",
    }),
    xrayTicket: "B2CQA-6039",
  },
  {
    transaction: new Transaction({
      accountToDebit: Account.SOL_1,
      accountToCredit: Account.SOL_2,
      amount: "0.000001",
      memoTag: "memo123",
    }),
    xrayTicket: "B2CQA-6040",
  },
];

registerNewSendFlowTests(nativeSendTransactions);
registerNewSendFlowTests(memoSendTransactions);
