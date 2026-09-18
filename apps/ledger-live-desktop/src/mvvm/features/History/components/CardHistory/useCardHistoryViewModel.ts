import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  isCardTransactionFundedBy,
  type CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { longDayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { SIDEBAR_VALUE_TO_PATH } from "LLD/components/SideBar/utils/constants";
import { formatCardTransactionAmount } from "LLD/components/RightPanel/Card/formatCardTransactionAmount";
import { HISTORY_ASSET_SEARCH_PARAM } from "../../constants";
import type { CardHistoryViewModel } from "./types";

export function useCardHistoryViewModel(): CardHistoryViewModel {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const asset = searchParams.get(HISTORY_ASSET_SEARCH_PARAM);
  // `?asset=` carries the linked wallet's provider pair, e.g. `usdc.ethereum`. Anything else is not
  // a pair the catalog can resolve, so it is read as no asset at all.
  const pair = asset?.split(".") ?? [];
  const [assetCode = "", network] = pair.length === 2 ? pair : [asset ?? ""];
  const locale = useSelector(localeSelector);
  const formatDay = useDateFormatter(longDayFormat);
  const formatters = useMemo(
    () => ({
      amount: (value: string, currency: string, kind: "fiat" | "crypto") =>
        formatCardTransactionAmount({ value, currency, kind, locale }),
    }),
    [locale],
  );
  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);
  const onGoToPay = useCallback(() => {
    navigate(SIDEBAR_VALUE_TO_PATH.paytab);
  }, [navigate]);

  // Asset mode: only the transactions this asset funded. The shared predicate resolves the pair
  // through the existing catalog, so an unknown one filters the list down to nothing.
  const filterTransaction = useMemo(
    () =>
      asset !== null
        ? (item: CardTransactionItem) => isCardTransactionFundedBy(item, assetCode, network)
        : undefined,
    [asset, assetCode, network],
  );

  return {
    formatters,
    formatDay,
    onTrackEvent,
    onGoToPay,
    filterTransaction,
    assetCode: asset !== null ? assetCode : undefined,
    columnSet: asset !== null ? "asset" : "card",
  };
}
