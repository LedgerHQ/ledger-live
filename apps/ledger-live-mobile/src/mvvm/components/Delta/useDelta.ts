import { Unit } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange, ValueChange } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";

type ColorType = "success" | "error" | "base";
type SignType = "+" | "-";

const getColorAndSign = (value: number): readonly [ColorType, SignType] => {
  if (value > 0) return ["success", "+"] as const;
  if (value < 0) return ["error", "-"] as const;
  return ["base", "-"] as const;
};

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
  sign: SignType;
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

  const roundedDelta = Number.parseFloat(delta.toFixed(2));

  if (roundedDelta === 0) return null;

  if (
    percent &&
    ((valueChange.percentage === 0 && !show0Delta) ||
      valueChange.percentage === null ||
      valueChange.percentage === undefined)
  ) {
    return null;
  }

  if (Number.isNaN(delta)) return null;

  const [color, sign] = getColorAndSign(roundedDelta);
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
