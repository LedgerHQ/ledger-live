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
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";
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
  available: boolean;
  quote: SponsoredFeeQuote | null;
  savingsFiatFormatted: string | null;
  feeCurrencyTicker: string;
  feeLoading: boolean;
}>;

const NO_ACCOUNT_PLACEHOLDER = {
  type: "Account",
  currency: {
    id: "__no_account_selected__",
    ticker: "",
    units: [{ name: "", code: "", magnitude: 0 }],
  },
} as unknown as AccountLike;

const SponsoredSendContext = createContext<SponsoredSendContextValue | null>(null);

export function SponsoredSendProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { state } = useSendFlowData();
  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const transaction = state.transaction.transaction;
  const flagEnabled = useFeature("gasSponsorship")?.enabled === true;

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount ?? undefined) : null),
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
        const seam = await getSponsoredCoinApi(network, SEAM_KIND);
        if (ignore) return;
        if (!seam) {
          setIntent(null);
          return;
        }
        const result = await buildGenericTransactionIntent(
          network,
          SEAM_KIND,
          mainAccount,
          transaction as unknown as GenericTransaction,
        );
        if (!ignore) setIntent(result);
      } catch {
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

  // Revert to standard when Tronify becomes unavailable (e.g. account changes, quote gone).
  // Never auto-select tronify — the user must choose it explicitly (Donjon security review).
  useEffect(() => {
    if (!available) setSelectedFeeOptionId("standard");
  }, [available]);

  // Reset the orchestration when the send identity changes. Clearing `intent` alone leaves the
  // reducer's order/phase alive, so returning to Review would let the rent screen skip craftRent and
  // sign/pay the previous intent's payment tx. reset is read through a ref so the effect need not
  // depend on `actions` (rebuilt whenever an order is crafted, which would reset mid-flow).
  const rentIntentKey = [
    account?.id,
    parentAccount?.id,
    transaction?.recipient,
    transaction?.amount?.toString(),
    transaction?.useAllAmount,
    transaction?.subAccountId,
  ].join("|");
  const resetRef = useRef(actions.reset);
  resetRef.current = actions.reset;
  useEffect(() => {
    resetRef.current();
  }, [rentIntentKey]);

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const savingsFiatFormatted = useMemo(
    () =>
      // estimateTronifyFees clamps savings to 0 when Tronify costs at least as much as the standard
      // fee; BigNumber(0) is still truthy, so gate on a positive value to avoid "Save $0.00" copy.
      savingsFiat && savingsFiat.gt(0)
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
