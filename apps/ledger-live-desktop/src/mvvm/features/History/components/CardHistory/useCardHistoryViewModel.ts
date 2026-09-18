import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
  const asset = searchParams.get(HISTORY_ASSET_SEARCH_PARAM) ?? undefined;
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

  return {
    formatters,
    formatDay,
    onTrackEvent,
    onGoToPay,
    asset,
  };
}
