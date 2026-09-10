import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { useSendFlowData } from "./SendFlowContext";
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

  const selectTronify = useCallback(() => setSelectedFeeOptionId("tronify"), []);
  const selectStandard = useCallback(() => setSelectedFeeOptionId("standard"), []);

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
      savingsFiat
        ? formatCurrencyUnit(counterValueCurrency.units[0], savingsFiat, {
            showCode: true,
            disableRounding: true,
            locale,
          })
        : null,
    [savingsFiat, counterValueCurrency, locale],
  );

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
