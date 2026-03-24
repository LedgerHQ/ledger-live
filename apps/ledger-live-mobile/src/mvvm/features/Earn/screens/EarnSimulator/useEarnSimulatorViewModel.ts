import { useState, useMemo, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { computeProjections, YearProjection } from "../../utils/compoundInterest";

const DEFAULT_CURRENCY_ID = "solana";
const DEFAULT_CURRENCY_NAME = "Solana";
const DEFAULT_APY = 7.32;
const DEFAULT_INITIAL_DEPOSIT = 1000;
const DEFAULT_MONTHLY_DEPOSIT = 100;
const PROJECTION_YEARS = 10;

const INITIAL_DEPOSIT_MIN = 0;
const INITIAL_DEPOSIT_MAX = 10_000;
const INITIAL_DEPOSIT_STEP = 100;

const MONTHLY_DEPOSIT_MIN = 0;
const MONTHLY_DEPOSIT_MAX = 10_000;
const MONTHLY_DEPOSIT_STEP = 100;

export type EarnSimulatorViewModel = {
  currencyId: string;
  currencyName: string;
  apy: number;
  initialDeposit: number;
  monthlyDeposit: number;
  chartData: YearProjection[];
  totalRewards: number;
  maxYValue: number;
  initialDepositConfig: SliderConfig;
  monthlyDepositConfig: SliderConfig;
  onInitialDepositChange: (value: number) => void;
  onMonthlyDepositChange: (value: number) => void;
  onSelectCurrency: () => void;
  onEarnPress: () => void;
};

type SliderConfig = {
  min: number;
  max: number;
  step: number;
};

export default function useEarnSimulatorViewModel(params?: {
  currencyId?: string;
  apy?: number;
}): EarnSimulatorViewModel {
  const navigation = useNavigation<BaseNavigation>();

  const [currencyId, setCurrencyId] = useState(params?.currencyId ?? DEFAULT_CURRENCY_ID);
  const [currencyName, setCurrencyName] = useState(DEFAULT_CURRENCY_NAME);
  const [apy, setApy] = useState(params?.apy ?? DEFAULT_APY);
  const [initialDeposit, setInitialDeposit] = useState(DEFAULT_INITIAL_DEPOSIT);
  const [monthlyDeposit, setMonthlyDeposit] = useState(DEFAULT_MONTHLY_DEPOSIT);

  const chartData = useMemo(
    () => computeProjections(initialDeposit, monthlyDeposit, apy, PROJECTION_YEARS),
    [initialDeposit, monthlyDeposit, apy],
  );

  const totalRewards = useMemo(() => chartData.reduce((sum, d) => sum + d.rewards, 0), [chartData]);

  const maxYValue = useMemo(() => {
    const maxDeposits = INITIAL_DEPOSIT_MAX + MONTHLY_DEPOSIT_MAX * 12 * PROJECTION_YEARS;
    return maxDeposits + Math.round((apy / 100) * maxDeposits);
  }, [apy]);

  const onSelectCurrency = useCallback(() => {
    // Placeholder — will open modular asset drawer in a future task.
    // For now, cycle back to defaults as a no-op demonstration.
    setCurrencyId(DEFAULT_CURRENCY_ID);
    setCurrencyName(DEFAULT_CURRENCY_NAME);
    setApy(DEFAULT_APY);
  }, []);

  const onEarnPress = useCallback(() => {
    navigation.navigate(NavigatorName.Earn, {
      screen: ScreenName.Earn,
      params: {},
    });
  }, [navigation]);

  return {
    currencyId,
    currencyName,
    apy,
    initialDeposit,
    monthlyDeposit,
    chartData,
    totalRewards,
    maxYValue,
    initialDepositConfig: {
      min: INITIAL_DEPOSIT_MIN,
      max: INITIAL_DEPOSIT_MAX,
      step: INITIAL_DEPOSIT_STEP,
    },
    monthlyDepositConfig: {
      min: MONTHLY_DEPOSIT_MIN,
      max: MONTHLY_DEPOSIT_MAX,
      step: MONTHLY_DEPOSIT_STEP,
    },
    onInitialDepositChange: setInitialDeposit,
    onMonthlyDepositChange: setMonthlyDeposit,
    onSelectCurrency,
    onEarnPress,
  };
}
