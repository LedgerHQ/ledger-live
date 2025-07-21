import memoize from "lodash/memoize";
import { dark, light, ModeColors, spacing, SpacingScale } from "./design-tokens";

// Missing overrides
const overrideOther = {
  "radius-s": "8px",
  "radius-xs": "4px",
  "border-width-default": "1px",
  "border-width-focus": "2px",
  "margin-xs": "8px",
  "margin-s": "16px",
  "margin-m": "24px",
  "margin-l": "32px",
  "spacing-xs": "12px",
  "spacing-xxs": "8px",
} as const;

const overrideColor = {
  light: {
    "surface-transparent-hover": "#0000000D",
    "surface-transparent-pressed": "#0000001A",
    "border-subdued-default-hover": "#D5D5D5",
    "border-subdued-default-pressed": "#C1C1C1",
    "border-active": "#D4A0FF",
  },
  dark: {
    "opacity-default-10": "#FFFFFF1A",
    "border-active": "#D4A0FF",
  },
} as const;

export type Tokens = Record<string, string | number>;
type ColorToken =
  | `colors-${keyof ModeColors}`
  | `colors-${keyof typeof overrideColor.light}`
  | `colors-${keyof typeof overrideColor.dark}`;

type OtherToken = keyof (SpacingScale & typeof overrideOther);
type Theme = "dark" | "light";

function pxToNumber(value: string): number {
  return Number(value.replace("px", ""));
}

function getThemeColors(theme: Theme) {
  const baseColors = theme === "dark" ? dark : light;
  const overrides = overrideColor[theme];
  return { ...baseColors, ...overrides };
}

export const useTokens = memoize(
  (theme: Theme, usedTokens: Array<ColorToken | OtherToken>) => {
    if (!usedTokens.length) return {};

    const usedSet = new Set(usedTokens);
    const tokens: Tokens = {};
    const colors = getThemeColors(theme);

    Object.entries(colors).forEach(([key, value]) => {
      const colorKey = `colors-${key}` as ColorToken;
      if (usedSet.has(colorKey)) {
        tokens[colorKey] = value;
      }
    });

    // Add spacing and other tokens
    [spacing, overrideOther].forEach((obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (usedSet.has(key as OtherToken)) {
          tokens[key] = pxToNumber(value);
        }
      });
    });

    return tokens;
  },
  // Simple cache key
  (theme, usedTokens) => `${theme}-${usedTokens.sort().join(",")}`,
);
