import { useCallback, useMemo } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { discreetModeSelector } from "~/reducers/settings";
import { useFormatDaySection } from "~/hooks/useDateFormatter";
import { navigateToPayTab } from "LLM/features/PayTab/utils/navigateToPayTab";
import { formatCardTransactionAmount } from "LLM/features/OperationsHistory/utils/formatCardTransactionAmount";

export type CardHistoryViewModel = Readonly<{
  formatters: CardTransactionFormatters;
  formatDay: (date: Date) => string;
  onGoToPay: () => void;
}>;

export function useCardHistoryViewModel(
  navigation: Pick<NavigationProp<ParamListBase>, "dispatch">,
): CardHistoryViewModel {
  const { locale } = useLocale();
  const discreet = useSelector(discreetModeSelector);
  const formatDay = useFormatDaySection();

  const formatters = useMemo<CardTransactionFormatters>(
    () => ({
      amount: (value, currency, kind) =>
        formatCardTransactionAmount({ value, currency, kind, locale, discreet }),
    }),
    [locale, discreet],
  );

  const onGoToPay = useCallback(() => {
    navigateToPayTab(navigation);
  }, [navigation]);

  return { formatters, formatDay, onGoToPay };
}
