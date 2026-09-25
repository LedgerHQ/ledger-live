import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { longDayFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { SIDEBAR_VALUE_TO_PATH } from "LLD/components/SideBar/utils/constants";
import { formatCardTransactionAmount } from "LLD/components/RightPanel/Card/formatCardTransactionAmount";
import type { CardHistoryViewModel } from "./types";

export function useCardHistoryViewModel(): CardHistoryViewModel {
  const navigate = useNavigate();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const formatDay = useDateFormatter(longDayFormat);
  const formatters = useMemo(
    () => ({
      amount: (value: string, currency: string, kind: "fiat" | "crypto") =>
        formatCardTransactionAmount({ value, currency, kind, locale, discreet }),
    }),
    [locale, discreet],
  );
  const onGoToPay = useCallback(() => {
    navigate(SIDEBAR_VALUE_TO_PATH.paytab);
  }, [navigate]);

  return { formatters, formatDay, onGoToPay };
}
