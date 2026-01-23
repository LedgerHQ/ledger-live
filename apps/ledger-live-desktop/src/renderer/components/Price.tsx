import React, { useMemo } from "react";
import styled from "styled-components";
import { BigNumber } from "bignumber.js";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { colors } from "~/renderer/styles/theme";
import useTheme from "~/renderer/hooks/useTheme";
import Box from "~/renderer/components/Box";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import IconActivity from "~/renderer/icons/Activity";
import { NoCountervaluePlaceholder } from "./CounterValue";
import { usePrice } from "~/renderer/hooks/usePrice";

type ColorKeys = keyof typeof colors;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resolveThemeColor(themeColors: Record<string, unknown>, path: string): string | undefined {
  const [group, shade] = path.split(".");
  if (!group || !shade) return undefined;
  const groupValue = themeColors[group];
  if (isRecord(groupValue)) {
    const shadeValue = groupValue[shade];
    if (typeof shadeValue === "string") return shadeValue;
  }
  return undefined;
}

function isColorKey(key: string): key is ColorKeys {
  return key in colors;
}

type Props = {
  unit?: Unit;
  rate?: BigNumber;
  showAllDigits?: boolean;
  from: Currency;
  to?: Currency;
  withActivityCurrencyColor?: boolean;
  withActivityColor?: ColorKeys;
  withIcon?: boolean;
  withEquality?: boolean;
  color?: ColorKeys | string; // Accepts legacy ColorKeys or design system paths like "neutral.c80"
  fontSize?: number;
  fontWeight?: number;
  iconSize?: number;
  placeholder?: React.ReactNode;
  dynamicSignificantDigits?: number;
  staticSignificantDigits?: number;
};
export default function Price({
  from,
  to,
  unit,
  withActivityCurrencyColor,
  withActivityColor,
  withEquality,
  placeholder,
  color,
  fontSize,
  fontWeight,
  iconSize,
  showAllDigits,
  withIcon = true,
  rate,
  dynamicSignificantDigits,
  staticSignificantDigits,
}: Props) {
  const { counterValue, valueNum, effectiveUnit, counterValueCurrency } = usePrice(
    from,
    to,
    unit,
    rate,
  );
  const theme = useTheme();
  // Resolve color to hex value (needed for activityColor which uses inline styles)
  const resolvedColor = useMemo(() => {
    if (!color) return undefined;
    // Check legacy colors object first
    if (isColorKey(color)) {
      return colors[color];
    }
    // Support design system paths like "neutral.c80"
    return resolveThemeColor(theme.colors, color);
  }, [color, theme]);
  const bgColor = theme.colors.background.card;
  const activityColor = useMemo(
    () =>
      withActivityColor
        ? colors[withActivityColor]
        : !withActivityCurrencyColor
          ? resolvedColor ?? theme.colors.neutral.c100
          : getCurrencyColor(from, bgColor),
    [
      bgColor,
      resolvedColor,
      from,
      withActivityColor,
      withActivityCurrencyColor,
      theme.colors.neutral.c100,
    ],
  );
  if (!counterValue || counterValue.isZero())
    return <NoCountervaluePlaceholder placeholder={placeholder} />;
  const subMagnitude = counterValue.lt(1) || showAllDigits ? 1 : 0;
  return (
    <PriceWrapper color={color ?? "neutral.c100"} fontSize={fontSize} fontWeight={fontWeight}>
      {withIcon ? (
        <IconActivity
          size={iconSize || 12}
          style={{
            color: activityColor,
            marginRight: 4,
            display: "inline-block",
            verticalAlign: "initial",
          }}
        />
      ) : null}
      {!withEquality ? null : (
        <>
          <CurrencyUnitValue value={BigNumber(valueNum)} unit={effectiveUnit} showCode />
          {" = "}
        </>
      )}
      <CurrencyUnitValue
        unit={counterValueCurrency.units[0]}
        value={counterValue}
        disableRounding={!!subMagnitude}
        subMagnitude={subMagnitude}
        dynamicSignificantDigits={dynamicSignificantDigits}
        staticSignificantDigits={staticSignificantDigits}
        showCode
      />
    </PriceWrapper>
  );
}
const PriceWrapper = styled(Box).attrs(() => ({
  ff: "Inter",
  horizontal: true,
}))`
  line-height: 1.2;
  white-space: pre;
  align-items: baseline;
  display: inline-flex;
  flex-shrink: 0;
`;
