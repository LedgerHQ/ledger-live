import memoize from "lodash/memoize";
import { css, DefaultTheme } from "styled-components";
import { dark, light, ModeColors, spacing, SpacingScale } from "./design-tokens";

// Add temporarily missing tokens here
const extra = {
  "radius-s": "8px",
} as const;

type ColorToken = `colors-${keyof ModeColors}`;
type OtherToken = keyof (SpacingScale & typeof extra);

export const withTokens = (...usedTokens: Array<ColorToken | OtherToken>) => {
  const filterTokens = memoize((theme: DefaultTheme["theme"]) => {
    const colors = { dark, light }[theme];

    const colorEntries = Object.entries(colors).flatMap(([key, value]) => {
      const color = `colors-${key}` as ColorToken;
      if (!usedTokens.includes(color)) return [];
      return [[`--${color}`, value]];
    });
    const otherEntries = [spacing, extra].flatMap(Object.entries).flatMap(([key, value]) => {
      if (!usedTokens.includes(key as OtherToken)) return [];
      return [[`--${key}`, value]];
    });

    return Object.fromEntries([...colorEntries, ...otherEntries]);
  });

  return css(({ theme }) => filterTokens(theme.colors.type as DefaultTheme["theme"]));
};
