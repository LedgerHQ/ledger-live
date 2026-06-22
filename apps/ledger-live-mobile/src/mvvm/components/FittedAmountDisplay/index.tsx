import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import {
  AmountDisplay,
  type AmountDisplayProps,
  type FormattedValue,
} from "@ledgerhq/lumen-ui-rnative";

const HORIZONTAL_INSET = 32;
const SCALE_SAFETY_MARGIN = 0.96;

/** Approximate rendered width per character in AmountDisplay (md ≈ heading1SemiBold). */
const CHAR_WIDTH_BY_SIZE = { md: 20, sm: 14 } as const;

function formatToString(parts: FormattedValue): string {
  const amount = parts.decimalPart
    ? `${parts.integerPart}${parts.decimalSeparator}${parts.decimalPart}`
    : parts.integerPart;

  if (!parts.currencyText) return amount;

  return parts.currencyPosition === "end"
    ? `${amount} ${parts.currencyText}`
    : `${parts.currencyText}${amount}`;
}

export function getAmountDisplayScale(
  displayText: string,
  fitWidth: number,
  size: keyof typeof CHAR_WIDTH_BY_SIZE = "md",
): number {
  const estimatedWidth = displayText.length * CHAR_WIDTH_BY_SIZE[size];
  return getScaleFromWidth(estimatedWidth, fitWidth);
}

export function getScaleFromWidth(contentWidth: number, fitWidth: number): number {
  if (fitWidth <= 0 || contentWidth <= 0 || contentWidth <= fitWidth) return 1;
  return (fitWidth / contentWidth) * SCALE_SAFETY_MARGIN;
}

export type FittedAmountDisplayProps = AmountDisplayProps & {
  /** Trailing space to reserve (e.g. discreet-mode icon + gap). */
  reservedTrailingWidth?: number;
};

/**
 * Wraps {@link AmountDisplay} and scales it down when the formatted amount is
 * wider than the available screen width (e.g. large balances in LBP).
 */
export function FittedAmountDisplay({
  reservedTrailingWidth = 0,
  size = "md",
  formatter,
  value,
  hidden = false,
  loading = false,
  animate = true,
  testID,
  ...rest
}: FittedAmountDisplayProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const parts = useMemo(() => formatter(value), [formatter, value]);
  const fullDisplayText = useMemo(() => formatToString(parts), [parts]);
  const fitWidth = windowWidth - HORIZONTAL_INSET - reservedTrailingWidth;

  // Always scale based on the full amount so toggling discreet mode does not flicker.
  const estimatedScale = getAmountDisplayScale(fullDisplayText, fitWidth, size);
  const measuredScale =
    measuredWidth > 0 ? getScaleFromWidth(measuredWidth, fitWidth) : estimatedScale;
  const scale = Math.min(estimatedScale, measuredScale);

  useEffect(() => {
    setMeasuredWidth(0);
  }, [fullDisplayText, fitWidth, hidden, value]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setMeasuredWidth(prev => (prev !== width ? width : prev));
  }, []);

  const amountDisplay = (
    <AmountDisplay
      value={value}
      formatter={formatter}
      size={size}
      hidden={hidden}
      loading={loading}
      animate={scale < 1 ? false : animate}
      testID={testID}
      {...rest}
    />
  );

  if (scale >= 1) {
    return (
      <View onLayout={onLayout} style={{ alignSelf: "center" }}>
        {amountDisplay}
      </View>
    );
  }

  return (
    <View
      style={{ width: fitWidth, alignSelf: "center", alignItems: "center", overflow: "hidden" }}
    >
      <View onLayout={onLayout} style={{ transform: [{ scale }] }}>
        {amountDisplay}
      </View>
    </View>
  );
}
