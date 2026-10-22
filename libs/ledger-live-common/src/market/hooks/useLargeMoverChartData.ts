import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../utils/timers";
import { useAssetChartDataInCounterValue } from "./useAssetChartDataInCounterValue";

type UseLargeMoverChartDataParams = {
  id: string;
  counterCurrency: string;
  range: string;
  isCryptoCountervalue: boolean;
};

export const useLargeMoverChartData = ({
  id,
  counterCurrency,
  range,
  isCryptoCountervalue,
}: UseLargeMoverChartDataParams) => {
  const { currentData, isLoading, isError } = useAssetChartDataInCounterValue(
    { id, counterCurrency, range, isCryptoCountervalue },
    { skip: !id, pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH },
  );

  return {
    chartData: currentData,
    isLoading,
    isError,
  };
};
