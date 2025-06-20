import memoize from "lodash/memoize";
import { dark, light, ModeColors, spacing, SpacingScale } from "./design-tokens";

// Override manquants
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
  },
  dark: {
    "opacity-default-10": "#FFFFFF1A",
  },
} as const;

export type Tokens = Record<string, string | number>;

type ColorToken =
  | `colors-${keyof ModeColors}`
  | `colors-${keyof typeof overrideColor.light}`
  | `colors-${keyof typeof overrideColor.dark}`;
type OtherToken = keyof (SpacingScale & typeof overrideOther);

function pxToNumber(value: string): number {
  return Number(value.replace("px", ""));
}

export const useTokens = memoize(
  (theme: "dark" | "light", usedTokens: Array<ColorToken | OtherToken>) => {
    const usedSet = new Set(usedTokens);

    const colors = {
      dark: { ...dark, ...overrideColor.dark },
      light: { ...light, ...overrideColor.light },
    }[theme];

    const tokens: Tokens = {};

    Object.entries(colors).forEach(([key, value]) => {
      const colorKey = `colors-${key}` as ColorToken;
      if (usedSet.has(colorKey)) {
        tokens[colorKey] = value;
      }
    });

    [spacing, overrideOther].forEach((obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (usedSet.has(key as OtherToken)) {
          tokens[key] = pxToNumber(value);
        }
      });
    });

    return tokens;
  },
);
