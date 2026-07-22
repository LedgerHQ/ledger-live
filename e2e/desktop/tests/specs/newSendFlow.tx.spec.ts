import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { NewSendFlowEntry, registerNewSendFlowTests } from "tests/utils/newSendFlowUtils";

const nativeSendTransactions: NewSendFlowEntry[] = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    xrayTicket: "B2CQA-2574",
  },
  {
    transaction: new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW),
    xrayTicket: "B2CQA-2573",
  },
  {
    transaction: new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.SLOW),
    xrayTicket: "B2CQA-2808",
  },
  {
    transaction: new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001"),
    xrayTicket: "B2CQA-2810",
  },
  {
    transaction: new Transaction(Account.SOL_1, Account.SOL_2, "0.000001"),
    xrayTicket: "B2CQA-2811",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    xrayTicket: "B2CQA-2812",
  },
  {
    transaction: new Transaction(Account.XLM_1, Account.XLM_2, "0.0001"),
    xrayTicket: "B2CQA-2813",
    bugTicket: "LIVE-29554",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "0.0001"),
    xrayTicket: "B2CQA-2816",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    xrayTicket: "B2CQA-3925, B2CQA-2724",
  },
  {
    transaction: new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2"),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.00001", Fee.MEDIUM),
    xrayTicket: "B2CQA-2714",
  },
  {
    transaction: new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001"),
    xrayTicket: "B2CQA-2721",
  },
  {
    transaction: new Transaction(Account.BTC_LEGACY_1, Account.BTC_LEGACY_2, "0.00001", Fee.MEDIUM),
    xrayTicket: "B2CQA-2722",
  },
  {
    transaction: new Transaction(Account.BTC_SEGWIT_1, Account.BTC_SEGWIT_2, "0.00001", Fee.MEDIUM),
    xrayTicket: "B2CQA-2723",
  },
  {
    transaction: new Transaction(
      Account.BTC_TAPROOT_1,
      Account.BTC_TAPROOT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    xrayTicket: "B2CQA-2725",
  },
  {
    transaction: new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW),
    xrayTicket: "B2CQA-2807",
    bugTicket: "LIVE-28070",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_2, "0.0001"),
    xrayTicket: "B2CQA-2809",
  },
  {
    transaction: new Transaction(Account.ADA_1, Account.ADA_2, "1"),
    xrayTicket: "B2CQA-2815",
  },
  {
    transaction: new Transaction(Account.APTOS_1, Account.APTOS_2, "0.0001"),
    xrayTicket: "B2CQA-2920",
  },
  {
    transaction: new Transaction(Account.SUI_1, Account.SUI_2, "0.0001"),
    xrayTicket: "B2CQA-3802",
  },
  {
    transaction: new Transaction(Account.BASE_1, Account.BASE_2, "0.000001"),
    xrayTicket: "B2CQA-4225",
    bugTicket: "LIVE-28070",
  },
  {
    transaction: new Transaction(Account.VET_1, Account.VET_2, "0.1"),
    xrayTicket: "B2CQA-4247",
  },
  {
    transaction: new Transaction(Account.ZEC_1, Account.ZEC_2, "0.001"),
    xrayTicket: "B2CQA-4299",
  },
  {
    transaction: new Transaction(Account.HEDERA_1, Account.HEDERA_2, "0.00001"),
    xrayTicket: "B2CQA-4284",
  },
  {
    transaction: new Transaction(Account.ICP_1, Account.ICP_2, "0.001"),
    xrayTicket: "B2CQA-4742",
  },
  {
    transaction: new Transaction(Account.OSMO_1, Account.OSMO_2, "0.00001"),
    xrayTicket: "B2CQA-6112",
  },
];

test.describe("New Send Flow - Native Send", () => {
  registerNewSendFlowTests(nativeSendTransactions);
});
