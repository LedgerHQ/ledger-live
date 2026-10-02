import type {
  AmountDisplaySize,
  FormattedValue,
  TimingConfig,
  TimingTokens,
} from "@ledgerhq/lumen-ui-rnative";
import { Box, RuntimeConstants } from "@ledgerhq/lumen-ui-rnative";
import type { LumenTypographyTokenName, StyledViewProps } from "@ledgerhq/lumen-ui-rnative/styles";
import { useResolveViewStyle, useStyleSheet, useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import React, { memo, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { TextStyle, ViewProps } from "react-native";
import { Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

type Digit = (typeof DIGITS)[number];

type DigitWidths = Record<Digit, number>;

type SplitChar = {
  value: string;
  type: "digit" | "separator";
};

type DigitStripProps = {
  value: Digit;
  animate: boolean;
  textStyle: TextStyle & { lineHeight: number };
  widths: DigitWidths;
};

type DigitStripListProps = {
  items: SplitChar[];
} & Omit<DigitStripProps, "value">;

export type AmountDisplayProps = ViewProps & {
  value: number;
  formatter: (value: number) => FormattedValue;
  hidden?: boolean;
  loading?: boolean;
  animate?: boolean;
  size?: AmountDisplaySize;
} & Omit<StyledViewProps, "children">;

// Lumen doesn't export its translation hook; English is enough for debugging.
const AMOUNT_HIDDEN_LABEL = "Amount hidden";

const useSplitText = (
  value: FormattedValue,
): {
  integerPart: SplitChar[];
  decimalPart: SplitChar[];
} => {
  return useMemo(
    () => ({
      integerPart: Array.from(value.integerPart, digit => ({
        value: digit,
        type: digit.match(/^\d$/) ? "digit" : "separator",
      })),
      decimalPart: value.decimalPart
        ? Array.from(value.decimalPart, digit => ({
            value: digit,
            type: "digit",
          }))
        : [],
    }),
    [value.integerPart, value.decimalPart],
  );
};

const buildAriaLabel = (parts: FormattedValue, hidden: boolean, hiddenLabel: string): string => {
  if (hidden) return hiddenLabel;

  const decimal = parts.decimalPart ? `${parts.decimalSeparator}${parts.decimalPart}` : "";
  const amount = `${parts.integerPart}${decimal}`;

  if (parts.currencyPosition === "end") {
    return `${amount} ${parts.currencyText}`;
  }

  return `${parts.currencyText} ${amount}`;
};

const useTimingConfig = ({ duration, easing }: TimingTokens): TimingConfig => {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      duration: theme.motion.durations[duration],
      easing: Easing.bezier(...theme.motion.easings[easing]),
    }),
    [duration, easing, theme],
  );
};

const PULSE_MIN_OPACITY = 0.35;

const PULSE_TIMING_DEFAULTS: TimingTokens = {
  duration: 1000,
  easing: "linear",
};

type PulseProps = {
  children: ReactNode;
  timing?: Partial<TimingTokens>;
  animate?: boolean;
} & StyledViewProps;

const Pulse = memo(({ children, timing, animate, style, lx = {}, ...props }: PulseProps) => {
  const sv = useSharedValue<number>(1);
  const resolvedLxStyle = useResolveViewStyle(lx, style);

  const timingConfig = useTimingConfig({
    duration: timing?.duration ?? PULSE_TIMING_DEFAULTS.duration,
    easing: timing?.easing ?? PULSE_TIMING_DEFAULTS.easing,
  });

  useEffect(() => {
    if (animate) {
      sv.value = withRepeat(
        withTiming(PULSE_MIN_OPACITY, timingConfig),
        -1,
        true,
        undefined,
        ReduceMotion.System,
      );
    } else {
      cancelAnimation(sv);
      sv.value = withTiming(1, timingConfig);
    }

    return () => {
      cancelAnimation(sv);
      sv.value = 1;
    };
  }, [sv, animate, timingConfig]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: sv.value,
    }),
    [sv],
  );

  return (
    <Animated.View {...props} collapsable={false} style={[resolvedLxStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
});
Pulse.displayName = "Pulse";

const TYPOGRAPHY_WIDTHS = {
  heading1SemiBold: {
    0: 25,
    1: 15.5,
    2: 23.5,
    3: 24.5,
    4: 25.5,
    5: 23.5,
    6: 25,
    7: 22,
    8: 24.5,
    9: 24.5,
  },
  heading2SemiBold: {
    0: 17.5,
    1: 11,
    2: 16.5,
    3: 17,
    4: 18,
    5: 16,
    6: 17.5,
    7: 15,
    8: 17,
    9: 17,
  },
  heading4SemiBold: {
    0: 13,
    1: 8.5,
    2: 12.5,
    3: 12.5,
    4: 13,
    5: 12,
    6: 12.5,
    7: 11.5,
    8: 12.5,
    9: 12.5,
  },
} as const satisfies Partial<Record<LumenTypographyTokenName, DigitWidths>>;

type MeasuredTypography = keyof typeof TYPOGRAPHY_WIDTHS;

type SizeTypographyConfig = {
  integer: MeasuredTypography;
  decimal: MeasuredTypography;
};

const SIZE_TYPOGRAPHY: Record<AmountDisplaySize, SizeTypographyConfig> = {
  md: { integer: "heading1SemiBold", decimal: "heading2SemiBold" },
  sm: { integer: "heading2SemiBold", decimal: "heading4SemiBold" },
};

const useStyles = (size: AmountDisplaySize) => {
  const typography = SIZE_TYPOGRAPHY[size];
  return useStyleSheet(
    t => ({
      container: {
        flexDirection: "row",
        alignItems: "flex-end",
      },
      integerPartContainer: {
        flexDirection: "row",
      },
      decimalPartContainer: {
        flexDirection: "row",
        paddingBottom: t.spacings.s2,
      },
      integerText: {
        ...t.typographies[typography.integer],
        color: t.colors.text.base,
      },
      decimalText: {
        ...t.typographies[typography.decimal],
        color: t.colors.text.muted,
      },
      currencyStartText: {
        ...t.typographies[typography.integer],
        color: t.colors.text.base,
      },
      currencyEndText: {
        ...t.typographies[typography.decimal],
        color: t.colors.text.muted,
      },
      spacingStart: {
        marginRight: t.spacings.s4,
      },
      spacingEnd: {
        marginLeft: t.spacings.s4,
      },
    }),
    [typography],
  );
};

const useAnimatedDigitStrip = ({
  value,
  lineHeight,
  targetWidth,
  width,
  animate,
}: {
  value: number;
  lineHeight: number;
  targetWidth: number;
  width: SharedValue<number>;
  animate: boolean;
}) => {
  const translateY = useSharedValue(-value * lineHeight);

  const timingConfig = useTimingConfig({
    duration: 700,
    easing: "easeInOut",
  });

  useEffect(() => {
    if (animate) {
      translateY.value = withTiming(-value * lineHeight, timingConfig);
      width.value = withTiming(targetWidth, timingConfig);
    } else {
      translateY.value = -value * lineHeight;
      width.value = targetWidth;
    }
  }, [value, lineHeight, translateY, animate, width, targetWidth, timingConfig]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
    }),
    [translateY],
  );

  return { animatedStyle };
};

// Horizontal breathing room for the clip box so glyphs that are slightly wider
// than the measured `targetWidth` are not cut on their left/right edges. RN has
// no per-axis overflow, so we extend the clip box horizontally while keeping the
// vertical clip tight to `lineHeight`
const HORIZONTAL_CLIP_PADDING = 8;

const DigitStrip = memo(({ value, textStyle, animate, widths }: DigitStripProps) => {
  const targetWidth = widths[value];
  const lineHeight = textStyle.lineHeight;
  const width = useSharedValue<number>(targetWidth);
  const { animatedStyle } = useAnimatedDigitStrip({
    value,
    lineHeight,
    targetWidth,
    width,
    animate,
  });

  return (
    <Animated.View
      style={{
        height: lineHeight,
        width: animate ? width : targetWidth,
      }}
      accessibilityValue={{ text: String(value) }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -HORIZONTAL_CLIP_PADDING,
          right: -HORIZONTAL_CLIP_PADDING,
          overflow: "hidden",
          alignItems: "center",
        }}
      >
        <Animated.View style={[animatedStyle, { alignItems: "center" }]}>
          {DIGITS.map(d => (
            <Text
              allowFontScaling={false}
              key={d}
              style={[textStyle, RuntimeConstants.isAndroid && { height: lineHeight }]}
            >
              {d}
            </Text>
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
});
DigitStrip.displayName = "DigitStrip";

const DigitStripList = memo(({ items, textStyle, animate, widths }: DigitStripListProps) => {
  return items.map((item, index) => {
    const key = items.length - index;
    if (item.type === "separator") {
      return (
        <Text allowFontScaling={false} key={key} style={textStyle}>
          {item.value}
        </Text>
      );
    }
    return (
      <DigitStrip
        key={key}
        value={Number(item.value) as DigitStripProps["value"]}
        animate={animate}
        textStyle={textStyle}
        widths={widths}
      />
    );
  });
});
DigitStripList.displayName = "DigitStripList";

export function AmountDisplay({
  value,
  formatter,
  hidden = false,
  loading = false,
  animate = true,
  size = "md",
  ...props
}: AmountDisplayProps) {
  const styles = useStyles(size);
  const parts = formatter(value);
  const splitDigits = useSplitText(parts);
  const ariaLabel = buildAriaLabel(parts, hidden, AMOUNT_HIDDEN_LABEL);
  const typography = SIZE_TYPOGRAPHY[size];
  const integerWidths = TYPOGRAPHY_WIDTHS[typography.integer];
  const decimalWidths = TYPOGRAPHY_WIDTHS[typography.decimal];

  return (
    <Box accessibilityLabel={ariaLabel} accessibilityState={{ busy: loading }} {...props}>
      <Pulse animate={loading}>
        <View
          style={styles.container}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.integerPartContainer}>
            {parts.currencyPosition === "start" && (
              <Text
                allowFontScaling={false}
                style={[styles.currencyStartText, styles.spacingStart]}
              >
                {parts.currencyText}
              </Text>
            )}
            {hidden ? (
              <Text allowFontScaling={false} style={styles.integerText}>
                ••••
              </Text>
            ) : (
              <DigitStripList
                items={splitDigits.integerPart}
                textStyle={styles.integerText}
                animate={animate}
                widths={integerWidths}
              />
            )}
          </View>
          <View style={styles.decimalPartContainer}>
            {!hidden && parts.decimalPart && (
              <Text allowFontScaling={false} style={styles.decimalText}>
                {parts.decimalSeparator}
              </Text>
            )}
            {parts.decimalPart && !hidden && (
              <DigitStripList
                items={splitDigits.decimalPart}
                textStyle={styles.decimalText}
                animate={animate}
                widths={decimalWidths}
              />
            )}
            {parts.currencyPosition === "end" && (
              <Text allowFontScaling={false} style={[styles.currencyEndText, styles.spacingEnd]}>
                {parts.currencyText}
              </Text>
            )}
          </View>
        </View>
      </Pulse>
    </Box>
  );
}
