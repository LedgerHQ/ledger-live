import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";

/**
 * Happy-path "send" transactions covered by the new send flow E2E spec.
 *
 * This is the single source of truth for which coins have a new-flow test.
 * Add new coins HERE (not inline in newSendFlow.tx.spec.ts): `NEW_SEND_FLOW_CURRENCY_IDS`
 * is derived from this list and used by send.tx.spec.ts to drop the same coin from the
 * legacy flow in the nightly run (E2E_SEND_FLOW_MODE=auto), so a "dual" coin is never
 * tested on both flows at once. See getSendFlowMode in tests/utils/featureFlagUtils.ts.
 */
export const transactionsNewSendFlow = [
  {
    transaction: new Transaction(
      Account.sep_ETH_1,
      Account.sep_ETH_2,
      "0.00001",
      Fee.SLOW,
    ),
    xrayTicket: "B2CQA-2574",
  },
  {
    transaction: new Transaction(
      Account.POL_1,
      Account.POL_2,
      "0.001",
      Fee.SLOW,
    ),
    xrayTicket: "B2CQA-2807",
  },
  {
    transaction: new Transaction(
      Account.DOGE_1,
      Account.DOGE_2,
      "0.01",
      Fee.SLOW,
    ),
    xrayTicket: "B2CQA-2573",
  },
  {
    transaction: new Transaction(
      Account.BCH_1,
      Account.BCH_2,
      "0.0001",
      Fee.SLOW,
    ),
    xrayTicket: "B2CQA-2808",
  },
  {
    transaction: new Transaction(Account.ALGO_1, Account.ALGO_2, "0.001"),
    xrayTicket: "B2CQA-2810",
  },
  {
    transaction: new Transaction(
      Account.SOL_1,
      Account.SOL_2,
      "0.000001",
      undefined,
      "noTag",
    ),
    xrayTicket: "B2CQA-2811",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    xrayTicket: "B2CQA-2812",
  },
  {
    transaction: new Transaction(
      Account.XLM_1,
      Account.XLM_2,
      "0.0001",
      undefined,
      "noTag",
    ),
    xrayTicket: "B2CQA-2813",
    bugTicket: "LIVE-29554",
  },
  {
    transaction: new Transaction(
      Account.XRP_1,
      Account.XRP_2,
      "0.0001",
      undefined,
      "noTag",
    ),
    xrayTicket: "B2CQA-2816",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
      Fee.MEDIUM,
    ),
    xrayTicket: "B2CQA-3925",
  },
  {
    transaction: new Transaction(
      Account.ETH_1,
      Account.ETH_3,
      "0.0001",
      Fee.SLOW,
    ),
    xrayTicket: "B2CQA-3924",
  },
  {
    transaction: new Transaction(Account.KASPA_1, Account.KASPA_2, "0.2"),
    xrayTicket: "B2CQA-3840",
  },
  {
    transaction: new Transaction(Account.BASE_1, Account.BASE_2, "0.000001"),
    xrayTicket: "B2CQA-4225",
  },
];

/**
 * Currency ids whose happy-path send is already covered by the new send flow spec.
 * Keyed on currency id (not family/ticker) on purpose: e.g. Currency.BASE has ticker
 * "ETH" but id "base", so family/ticker keying would wrongly drop non-migrated coins.
 */
export const NEW_SEND_FLOW_CURRENCY_IDS = new Set(
  transactionsNewSendFlow.map(
    (entry) => entry.transaction.accountToDebit.currency.id,
  ),
);
