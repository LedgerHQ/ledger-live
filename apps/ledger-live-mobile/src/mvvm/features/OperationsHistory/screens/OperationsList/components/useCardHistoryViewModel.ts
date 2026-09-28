import { useCallback, useMemo } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import { useLocale } from "~/context/Locale";
import { useFormatDaySection } from "~/hooks/useDateFormatter";
import { track } from "~/analytics";
import { navigateToPayTab } from "LLM/features/PayTab/utils/navigateToPayTab";
import { formatCardTransactionAmount } from "LLM/features/OperationsHistory/utils/formatCardTransactionAmount";

export type CardHistoryViewModel = Readonly<{
  formatters: CardTransactionFormatters;
  formatDay: (date: Date) => string;
  onTrackEvent: (event: string, params: Record<string, unknown>) => void;
  onGoToPay: () => void;
}>;

export function useCardHistoryViewModel(
  navigation: Pick<NavigationProp<ParamListBase>, "dispatch">,
): CardHistoryViewModel {
  const { locale } = useLocale();
  const formatDay = useFormatDaySection();

  const formatters = useMemo<CardTransactionFormatters>(
    () => ({
      amount: (value, currency, kind) =>
        formatCardTransactionAmount({ value, currency, kind, locale }),
    }),
    [locale],
  );

  const onTrackEvent = useCallback((event: string, params: Record<string, unknown>) => {
    track(event, params);
  }, []);

  const onGoToPay = useCallback(() => {
    navigateToPayTab(navigation);
  }, [navigation]);

  return { formatters, formatDay, onTrackEvent, onGoToPay };
}
