import { Unit } from "@domain/entity-currency-unit";
import { PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { getTrendSign, getTrendTone, type TrendSign, type TrendTone } from "@shared/trend";
import { useTranslation } from "~/context/Locale";

type ColorType = "success" | "error" | "base";

const COLOR_BY_TONE: Record<TrendTone, ColorType> = {
  positive: "success",
  negative: "error",
  neutral: "base",
};

const DELTA_DECIMALS = 2;

type UseDeltaParams = {
  valueChange: ValueChange;
  percent?: boolean;
  unit?: Unit;
  range?: PortfolioRange;
  show0Delta?: boolean;
  isPercentSignDisplayed?: boolean;
  isArrowDisplayed?: boolean;
};

type UseDeltaResult = {
  color: ColorType;
  sign: TrendSign;
  absDelta: number;
  rangeText: string;
  percentSign: string;
  arrowPrefix: string;
  currencyBefore: string;
  currencyAfter: string;
  percentValue: string;
  hasUnit: boolean;
} | null;

export const useDelta = ({
  valueChange,
  percent,
  unit,
  range,
  show0Delta,
  isPercentSignDisplayed = false,
  isArrowDisplayed = true,
}: UseDeltaParams): UseDeltaResult => {
  const { t } = useTranslation();

  const delta =
    (percent || isPercentSignDisplayed) && valueChange.percentage != null
      ? valueChange.percentage * 100
      : valueChange.value;

  if (
    percent &&
    ((valueChange.percentage === 0 && !show0Delta) ||
      valueChange.percentage === null ||
      valueChange.percentage === undefined)
  ) {
    return null;
  }

  if (Number.isNaN(delta)) return null;

  const tone = getTrendTone(delta, { decimals: DELTA_DECIMALS });
  if (tone === "neutral" && !show0Delta) return null;

  const color = COLOR_BY_TONE[tone];
  const sign = getTrendSign(delta, { decimals: DELTA_DECIMALS });
  const absDelta = Math.abs(delta);

  const rangeText = range ? ` (${t("time." + range)})` : "";
  const percentSign = isPercentSignDisplayed ? "%" : "";
  const arrowPrefix = percent && isArrowDisplayed ? `${sign}` : "";
  const currencyBefore = isPercentSignDisplayed ? sign : `(${sign}`;
  const currencyAfter = isPercentSignDisplayed ? "" : ")";
  const percentValue = `${absDelta.toFixed(2)}%`;
  const hasUnit = Boolean(unit && absDelta !== 0);

  return {
    color,
    sign,
    absDelta,
    rangeText,
    percentSign,
    arrowPrefix,
    currencyBefore,
    currencyAfter,
    percentValue,
    hasUnit,
  };
};
