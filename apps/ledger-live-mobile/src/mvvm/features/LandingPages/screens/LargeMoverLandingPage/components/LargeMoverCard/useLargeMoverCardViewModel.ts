import { useLargeMoverChartData } from "@ledgerhq/live-common/market/hooks/useLargeMoverChartData";

type UseLargeMoverCardViewModelParams = Readonly<{
  ledgerId: string;
  counterCurrency: string;
  range: string;
  isCryptoCountervalue: boolean;
}>;

export function useLargeMoverCardViewModel({
  ledgerId,
  counterCurrency,
  range,
  isCryptoCountervalue,
}: UseLargeMoverCardViewModelParams) {
  const { chartData, isLoading } = useLargeMoverChartData({
    id: ledgerId,
    counterCurrency,
    range,
    isCryptoCountervalue,
  });

  return {
    chartData,
    loading: isLoading,
  };
}
