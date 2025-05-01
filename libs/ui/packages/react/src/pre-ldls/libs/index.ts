import memoize from "lodash/memoize";
import { css, DefaultTheme } from "styled-components";
import { dark, light, ModeColors, spacing, SpacingScale } from "./design-tokens";

// Add temporarily missing tokens here
const extraOther = {
  "radius-s": "8px",
  "radius-xs": "4px",
  "margin-xs": "8px", // redefines marging-xs
  "margin-s": "16px", // redefines marging-s
  "margin-m": "24px", // redefines marging-m
  "margin-l": "32px", // redefines marging-l
} as const;

const overrideOther = {
  "spacing-xs": "12px", // from "spacing-xxs": "12px"
  "spacing-xxs": "8px", // from "spacing-xs": "8px"
} as const;

// override colours based on Figma differing from design-tokens.ts
const overrideColor = {
  light: {
    "surface-transparent-hover": "#0000000D",
    "surface-transparent-pressed": "#0000001A",
  },
  dark: {},
} as const;

type ColorToken = `colors-${keyof ModeColors}`;
type OtherToken = keyof (SpacingScale & typeof extraOther);

export const withTokens = (...usedTokens: Array<ColorToken | OtherToken>) => {
  const filterTokens = memoize((theme: DefaultTheme["theme"]) => {
    const colors = {
      dark: { ...dark, ...overrideColor.dark },
      light: { ...light, ...overrideColor.light },
    }[theme];

    const colorEntries = Object.entries(colors).flatMap(([key, value]) => {
      const color = `colors-${key}` as ColorToken;
      if (!usedTokens.includes(color)) return [];
      return [[`--${color}`, value]];
    });
    const otherEntries = [spacing, overrideOther, extraOther]
      .flatMap(Object.entries)
      .flatMap(([key, value]) => {
        if (!usedTokens.includes(key as OtherToken)) return [];
        return [[`--${key}`, value]];
      });

    return Object.fromEntries([...colorEntries, ...otherEntries]);
  });

  return css(({ theme }) => filterTokens(theme.colors.type as DefaultTheme["theme"]));
};
