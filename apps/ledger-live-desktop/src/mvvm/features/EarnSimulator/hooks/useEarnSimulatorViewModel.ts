import { useState, useMemo, useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { computeProjections, YearProjection } from "../utils/compoundInterest";
import { closeEarnSimulator } from "../earnSimulatorDialog";

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

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
};

export type EarnSimulatorViewModel = {
  isOpen: boolean;
  currencyId: string;
  currencyName: string;
  apy: number;
  initialDeposit: number;
  monthlyDeposit: number;
  chartData: YearProjection[];
  totalRewards: number;
  initialDepositConfig: SliderConfig;
  monthlyDepositConfig: SliderConfig;
  onInitialDepositChange: (value: number) => void;
  onMonthlyDepositChange: (value: number) => void;
  onSelectCurrency: () => void;
  onEarnPress: () => void;
  onClose: () => void;
};

export default function useEarnSimulatorViewModel(isOpen: boolean): EarnSimulatorViewModel {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currencyId, setCurrencyId] = useState(DEFAULT_CURRENCY_ID);
  const [currencyName, setCurrencyName] = useState(DEFAULT_CURRENCY_NAME);
  const [apy, setApy] = useState(DEFAULT_APY);
  const [initialDeposit, setInitialDeposit] = useState(DEFAULT_INITIAL_DEPOSIT);
  const [monthlyDeposit, setMonthlyDeposit] = useState(DEFAULT_MONTHLY_DEPOSIT);

  const chartData = useMemo(
    () => computeProjections(initialDeposit, monthlyDeposit, apy, PROJECTION_YEARS),
    [initialDeposit, monthlyDeposit, apy],
  );

  const totalRewards = useMemo(() => {
    const last = chartData[chartData.length - 1];
    return last?.rewards ?? 0;
  }, [chartData]);

  const onClose = useCallback(() => {
    dispatch(closeEarnSimulator());
  }, [dispatch]);

  const onSelectCurrency = useCallback(() => {
    setCurrencyId(DEFAULT_CURRENCY_ID);
    setCurrencyName(DEFAULT_CURRENCY_NAME);
    setApy(DEFAULT_APY);
  }, []);

  const onEarnPress = useCallback(() => {
    dispatch(closeEarnSimulator());
    navigate("/earn");
  }, [dispatch, navigate]);

  return {
    isOpen,
    currencyId,
    currencyName,
    apy,
    initialDeposit,
    monthlyDeposit,
    chartData,
    totalRewards,
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
    onClose,
  };
}
