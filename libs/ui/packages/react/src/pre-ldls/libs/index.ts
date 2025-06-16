import memoize from "lodash/memoize";
import { css, DefaultTheme } from "styled-components";
import { dark, light, ModeColors, spacing, SpacingScale } from "./design-tokens";

// Add temporarily missing and override incorrect tokens here
const overrideOther = {
  "radius-s": "8px", // missing from tokens
  "radius-xs": "4px", // missing from tokens
  "border-width-default": "1px", // missing from tokens
  "border-width-focus": "2px", // missing from tokens
  "margin-xs": "8px", // redefines marging-xs
  "margin-s": "16px", // redefines marging-s
  "margin-m": "24px", // redefines marging-m
  "margin-l": "32px", // redefines marging-l

  "spacing-xs": "12px", // override from "spacing-xxs": "12px"
  "spacing-xxs": "8px", // override from "spacing-xs": "8px"
} as const;

// Add temporarily missing and override incorrect colours here
const overrideColor = {
  light: {
    "surface-transparent-hover": "#0000000D", // override from colours
    "surface-transparent-pressed": "#0000001A", // override from colours
    "border-subdued-default-hover": "#D5D5D5", // override from colours

    "border-subdued-default-pressed": "#C1C1C1", // missing from colours
  },
  dark: {
    "opacity-default-10": "#FFFFFF1A", // missing from colours
  },
} as const;

type ColorToken =
  | `colors-${keyof ModeColors}`
  | `colors-${keyof typeof overrideColor.light}`
  | `colors-${keyof typeof overrideColor.dark}`;
type OtherToken = keyof (SpacingScale & typeof overrideOther);

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
    const otherEntries = [spacing, overrideOther]
      .flatMap(Object.entries)
      .flatMap(([key, value]) => {
        if (!usedTokens.includes(key as OtherToken)) return [];
        return [[`--${key}`, value]];
      });

    return Object.fromEntries([...colorEntries, ...otherEntries]);
  });

  return css(({ theme }) => filterTokens(theme.colors.type as DefaultTheme["theme"]));
};
