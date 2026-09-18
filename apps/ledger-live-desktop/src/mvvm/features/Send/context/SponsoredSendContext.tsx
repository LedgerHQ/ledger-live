import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import { useFeature } from "@features/platform-feature-flags";
import { useSponsoredSendOrchestration } from "@ledgerhq/live-common/flows/send/sponsored/useSponsoredSendOrchestration";
import type { SponsoredState } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { buildGenericTransactionIntent } from "@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useSendFlowData, useSendFlowActions } from "./SendFlowContext";
import { useSponsoredFee, type SponsoredFeeQuote } from "../hooks/useSponsoredFee";

const SEAM_KIND = "local";

export type SponsoredFeeOptionId = "standard" | "tronify";

export type SponsoredSendActions = ReturnType<typeof useSponsoredSendOrchestration>["actions"];

type SponsoredSendContextValue = Readonly<{
  state: SponsoredState;
  actions: SponsoredSendActions;
  selectedFeeOptionId: SponsoredFeeOptionId;
  selectTronify: () => void;
  selectStandard: () => void;
  /** True when the Tronify sponsored option is advertised for the current send intent. */
  available: boolean;
  quote: SponsoredFeeQuote | null;
  /** Sponsored savings already formatted in the user's countervalue currency, or null while no
   * quote is loaded. Formatted once here so the AMOUNT nudge and the FEE_PAYMENT selector share one
   * computation instead of each re-running formatCurrencyUnit. */
  savingsFiatFormatted: string | null;
  /** Ticker of the currency fees are paid in (the parent chain's, TRX) — surfaced so fee copy can
   * interpolate it instead of hardcoding "USDT". */
  feeCurrencyTicker: string;
  /** Named distinctly from the sponsored-payment orchestration's own loading (state.phase) —
   * this is useSponsoredFee's availability/quote resolution, not the rent-payment flow. */
  feeLoading: boolean;
}>;

/**
 * useSponsoredFee's `account` param is required (AccountLike) and unconditionally resolves
 * getMainAccount(account) on every render — a null account would throw inside that hook. The
 * Send flow's own account state IS nullable (no account chosen yet on RECIPIENT), and this
 * provider mounts around every step including RECIPIENT, so hooks can't be called conditionally
 * here. This placeholder is passed only while no real account exists yet: its currency id never
 * matches a real coin-module, so getSponsoredCoinApi resolves it to null (same not-sponsored path
 * any non-TRON currency takes) and the hook settles to available:false without a network call.
 */
const NO_ACCOUNT_PLACEHOLDER = {
  type: "Account",
  currency: {
    id: "__no_account_selected__",
    ticker: "",
    units: [{ name: "", code: "", magnitude: 0 }],
  },
} as unknown as AccountLike;

const SponsoredSendContext = createContext<SponsoredSendContextValue | null>(null);

/**
 * Provider for the shared TRON Tronify sponsored-send orchestration (useSponsoredSendOrchestration),
 * mounted around the Send flow screens so any of them can call useSponsoredSend().
 *
 * Must live inside SendFlowProvider (reads useSendFlowData()) — see index.tsx for the mount point.
 * Mounts around the whole Send flow, so the intent build below is gated to the sponsored path: the
 * orchestration itself is a lazy no-op off that path, but buildGenericTransactionIntent runs the
 * family's real craftTransactionData, which must not fire for every currency on every keystroke.
 */
export function SponsoredSendProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;

  // getMainAccount throws on a null account — only resolve it once one exists (mirrors
  // useSponsoredFee.ts's own guard shape, one level up since account itself may be absent here).
  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount) : null),
    [account, parentAccount],
  );

  const [intent, setIntent] = useState<unknown>(null);

  useEffect(() => {
    let ignore = false;

    if (!flagEnabled || !mainAccount || !transaction) {
      setIntent(null);
      return;
    }

    // Identity-gate the intent: clear it up front on any transaction change so the previous intent
    // never survives into the async rebuild window. Otherwise a quick edit + Review could enter
    // sponsored signing (craftRent closes over `intent`) against the prior transaction's intent.
    setIntent(null);

    (async () => {
      try {
        const network = mainAccount.currency.id;
        // Gate on the seam resolving BEFORE building the intent: buildGenericTransactionIntent runs the
        // family's real craftTransactionData, so without this every currency's crafting logic would run
        // on every keystroke of every send. getSponsoredCoinApi returns null for any non-sponsored
        // family (its coin-module lacks the seam methods), which scopes the build to TRON+Tronify — no
        // hardcoded family id, same presence mechanism useSponsoredFee relies on.
        const seam = await getSponsoredCoinApi(network, SEAM_KIND);
        if (ignore) return;
        if (!seam) {
          setIntent(null);
          return;
        }
        // `transaction` is the family Transaction; buildGenericTransactionIntent wants a
        // GenericTransaction — the two shapes are asserted compatible here rather than widened at the
        // flow-state level, since SendFlowState.transaction is family-generic by design.
        const result = await buildGenericTransactionIntent(
          network,
          SEAM_KIND,
          mainAccount,
          transaction as unknown as GenericTransaction,
        );
        if (!ignore) setIntent(result);
      } catch {
        // Seam resolution (coin-module load) or the family builder (a mid-edit / not-yet-valid
        // transaction) can reject; settle intent to null rather than leak an unhandled rejection —
        // the sponsored path stays unavailable until the next valid state. Mirrors the same guard in
        // useSponsoredFee / useSponsoredSendOrchestration.
        if (!ignore) setIntent(null);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [flagEnabled, mainAccount, transaction]);

  const network = mainAccount?.currency.id ?? "";
  const { state: sponsoredState, actions } = useSponsoredSendOrchestration({
    network,
    kind: SEAM_KIND,
    intent,
  });

  const [selectedFeeOptionId, setSelectedFeeOptionId] = useState<SponsoredFeeOptionId>("standard");

  // Mark the transaction sponsored alongside the local selection: the generic signer copies
  // `transaction.sponsored` into the optimistic operation, and `getPendingNativeSpent` skips the
  // standard native fee only when that marker is true. Without it a successful sponsored send would
  // phantom-lock a standard TRX fee on the parent account until the next sync. The marker is inert
  // for crafting/estimation (coin-tron reads it nowhere), so toggling it has no fee side-effect.
  const selectTronify = useCallback(() => {
    setSelectedFeeOptionId("tronify");
    transactionActions.updateTransaction(tx => ({ ...tx, sponsored: true }) as typeof tx);
  }, [transactionActions]);
  const selectStandard = useCallback(() => {
    setSelectedFeeOptionId("standard");
    transactionActions.updateTransaction(tx => ({ ...tx, sponsored: false }) as typeof tx);
  }, [transactionActions]);

  // Single source of sponsored fee state: run once here so AMOUNT's nudge and the floating
  // FEE_PAYMENT selector both read the same result instead of each mounting their own instance
  // (which would double the seam/estimate calls and could flicker between the two screens).
  const {
    available,
    quote,
    savingsFiat,
    feeCurrencyTicker,
    loading: feeLoading,
  } = useSponsoredFee({
    account: account ?? NO_ACCOUNT_PLACEHOLDER,
    parentAccount: parentAccount ?? undefined,
    intent,
  });

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const savingsFiatFormatted = useMemo(
    () =>
      // `estimateTronifyFees` clamps savings to 0 when Tronify costs at least as much as the standard
      // fee; a `BigNumber(0)` is still truthy, so gate on a positive value.
      savingsFiat && savingsFiat.gt(0)
        ? formatCurrencyUnit(counterValueCurrency.units[0], savingsFiat, {
            showCode: true,
            disableRounding: true,
            locale,
          })
        : null,
    [savingsFiat, counterValueCurrency, locale],
  );

  // Revert to standard when the sponsored option stops being available (flag off, or availability lost
  // after an account/details change) while Tronify is selected. Otherwise the `sponsored` marker stays
  // true and the standard signature path skips locking the TRX fee — a phantom-unlocked fee on a send
  // that is no longer sponsored.
  useEffect(() => {
    if (selectedFeeOptionId === "tronify" && (!flagEnabled || !available)) {
      selectStandard();
    }
  }, [selectedFeeOptionId, flagEnabled, available, selectStandard]);

  // Identity of every field the rent order is crafted from, EXCLUDING the `sponsored` fee-option
  // marker — toggling the marker must not discard a crafted order. `useAllAmount` is part of it: a
  // token max-send leaves `amount` at 0 while changing the real simulated amount, so omitting it would
  // let a stale order survive a max toggle. Joined into one string so the reset effect's dep array
  // holds a plain identifier, not a method call.
  const rentIntentKey = [
    account?.id,
    parentAccount?.id,
    transaction?.recipient,
    transaction?.amount?.toString(),
    transaction?.useAllAmount,
    transaction?.subAccountId,
  ].join("|");

  // Reset the orchestration when that identity changes. Clearing `intent` alone leaves the reducer's
  // order/phase/requestRef alive, so returning to Review lets the rent-signature screen skip craftRent
  // and sign/pay the previous intent's payment tx. reset is read through a ref so the effect need not
  // depend on `actions`, which is rebuilt whenever an order is crafted and would reset mid-flow.
  const resetRef = useRef(actions.reset);
  resetRef.current = actions.reset;
  useEffect(() => {
    resetRef.current();
  }, [rentIntentKey]);

  const value = useMemo(
    () => ({
      state: sponsoredState,
      actions,
      selectedFeeOptionId,
      selectTronify,
      selectStandard,
      available,
      quote,
      savingsFiatFormatted,
      feeCurrencyTicker,
      feeLoading,
    }),
    [
      sponsoredState,
      actions,
      selectedFeeOptionId,
      selectTronify,
      selectStandard,
      available,
      quote,
      savingsFiatFormatted,
      feeCurrencyTicker,
      feeLoading,
    ],
  );

  return <SponsoredSendContext.Provider value={value}>{children}</SponsoredSendContext.Provider>;
}

export function useSponsoredSend(): SponsoredSendContextValue {
  const context = useContext(SponsoredSendContext);
  if (!context) {
    throw new Error("useSponsoredSend must be used within a SponsoredSendProvider");
  }
  return context;
}
