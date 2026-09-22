import { useEffect, useRef } from "react";
import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useDispatch } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { useSendFlowData } from "../context/SendFlowContext";
import { useSponsoredSend } from "../context/SponsoredSendContext";

/** Sun per TRX — the rent payment (TX-A) debits native TRX, but the order quotes payCoinAmt in TRX. */
const SUN_PER_TRX = 1_000_000;

/**
 * Reserve the rent payment (TX-A) against the payer's native balance for the two-signature Tronify
 * sponsored send. TX-A is a real TRX debit the payer signs and Tronify broadcasts, but nothing else
 * records it locally: the shared orchestration is platform-agnostic (no redux), and TX-C's own
 * optimistic op is `sponsored:true`, so `getPendingNativeSpent` deliberately skips its fee. Without
 * this the paid TRX stays spendable until the next sync, so a second send could double-spend it and
 * send-max would overcount. Synthesize a pending FEES op locking `payCoinAmt` and clearing when TX-A
 * syncs in by hash.
 *
 * Fires once per successful submission (POLLING entry, keyed by paymentTxId): a retry that re-crafts
 * pays again under a fresh id and gets its own reservation, while a re-render at the same phase does
 * not. Mounted once at the send layout beside useSponsoredPhaseNavigator; inert off the sponsored
 * path (phase never leaves IDLE).
 */
export function useSponsoredRentReservation(): void {
  const { state: sendFlowState } = useSendFlowData();
  const { state } = useSponsoredSend();
  const reduxDispatch = useDispatch();

  const account = sendFlowState.account.account;
  const parentAccount = sendFlowState.account.parentAccount;
  const { phase, order, payerAddress, paymentTxId } = state;

  const reservedTxIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== SPONSORED_PHASE.POLLING) return;
    if (!account || !order || !payerAddress || !paymentTxId) return;
    if (reservedTxIdRef.current === paymentTxId) return;

    // payCoinAmt is TRX and bounded/verified upstream (assertSignableTransferMatchesRequest); a
    // non-finite value here is not a real reservation, so skip rather than lock a NaN amount.
    const reservedSun = new BigNumber(order.payCoinAmt).times(SUN_PER_TRX);
    if (!reservedSun.isFinite() || reservedSun.isNegative()) return;

    const mainAccount = getMainAccount(account, parentAccount);
    reservedTxIdRef.current = paymentTxId;

    // A pending FEES op locks exactly `fee` on the native balance (getPendingNativeSpent adds op.fee
    // for a non-sponsored op and no value for a FEES type). No transactionRaw, so it is NOT read as
    // sponsored — that marker is what would skip the lock. hash = TX-A's id so the next sync reconciles
    // it against the real on-chain op and drops the pending entry.
    const op: Operation = {
      id: encodeOperationId(mainAccount.id, paymentTxId, "FEES"),
      hash: paymentTxId,
      type: "FEES",
      value: new BigNumber(0),
      fee: reservedSun,
      senders: [payerAddress],
      recipients: [],
      blockHeight: null,
      blockHash: null,
      accountId: mainAccount.id,
      date: new Date(),
      extra: {},
    };

    reduxDispatch(
      updateAccountWithUpdater(mainAccount.id, (acc: Account) => addPendingOperation(acc, op)),
    );
  }, [phase, account, parentAccount, order, payerAddress, paymentTxId, reduxDispatch]);
}
