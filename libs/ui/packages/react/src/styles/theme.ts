import { keyframes, css, Font } from "styled-components";
import { palettes, ColorPalette } from "@ledgerhq/ui-shared";

export type screensBreakpoints = "sm" | "md" | "lg" | "xl" | "xxl";

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  xxl: "1536px",
} as Record<screensBreakpoints, string>;

export const space = [
  /* space indexes:
  0, 1, 2, 3, 4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 */
  0, 2, 4, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76,
];

export type TextVariants =
  | "h1"
  | "h1Inter"
  | "h2"
  | "h2Inter"
  | "h3"
  | "h3Inter"
  | "h4"
  | "h4Inter"
  | "h5"
  | "h5Inter"
  | "large"
  | "largeLineHeight"
  | "body"
  | "bodyLineHeight"
  | "paragraph"
  | "paragraphLineHeight"
  | "small"
  | "extraSmall"
  | "tiny"
  | "micro"
  | "subtitle";

export type ThemeScale<Type, Aliases extends string> = Array<Type> & Record<Aliases, Type>;

export const fontSizes = [8, 10, 11, 12, 13, 14, 16, 20, 24, 28, 32, 36] as ThemeScale<
  number,
  TextVariants
>;

[
  fontSizes.micro,
  fontSizes.tiny,
  fontSizes.extraSmall,
  fontSizes.small,
  fontSizes.paragraph,
  fontSizes.body,
  fontSizes.large,
  fontSizes.h5,
  fontSizes.h4,
  fontSizes.h3,
  fontSizes.h2,
  fontSizes.h1,
] = fontSizes;
fontSizes.largeLineHeight = fontSizes.large;
fontSizes.bodyLineHeight = fontSizes.body;
fontSizes.paragraphLineHeight = fontSizes.paragraph;
fontSizes.subtitle = fontSizes.extraSmall;
fontSizes.h1Inter = fontSizes.h1;
fontSizes.h2Inter = fontSizes.h2;
fontSizes.h3Inter = fontSizes.h3;
fontSizes.h4Inter = fontSizes.h4;
fontSizes.h5Inter = fontSizes.h5;

const fontWeights = {
  extraLight: "100",
  light: "300",
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
};

export const radii = [0, 4, 8, 12, 16, 20];
export const shadows = ["0 4px 8px 0 rgba(0, 0, 0, 0.03)"];
export const zIndexes = [-1, 0, 1, 9, 10, 90, 100, 900, 1000];

// Those fonts are now defined in global.css, this is just a mapping for styled-system
export const fontFamilies = {
  Inter: {
    ExtraLight: {
      weight: 100,
      style: "normal",
    },
    Light: {
      weight: 300,
      style: "normal",
    },
    Regular: {
      weight: 400,
      style: "normal",
    },
    Medium: {
      weight: 500,
      style: "normal",
    },
    SemiBold: {
      weight: 600,
      style: "normal",
    },
    Bold: {
      weight: 700,
      style: "normal",
    },
    ExtraBold: {
      weight: 800,
      style: "normal",
    },
  },
  Alpha: {
    Medium: {
      weight: 500,
      style: "normal",
    },
  },
};

const animationDuration = "0.33s";
const easings = {
  outQuadratic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
};

const transition = (
  properties = ["all"],
  duration = animationDuration,
  easing = easings.outQuadratic,
) => css`
  transition-property: ${properties.join(",")};
  transition-duration: ${duration};
  transition-timing-function: ${easing};
`;

const fadeIn = keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  `;
const fadeOut = keyframes`
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  `;
const fadeInGrowX = keyframes`
    0% {
      opacity: 0;
      transform: scaleX(0);
    }
    100% {
      opacity: 1;
      transform: scaleX(1);
    }
`;
const fadeInUp = keyframes`
    0% {
      opacity: 0;
      transform: translateY(66%);
    }
    100% {
      opacity: 1;
      transform: translateY(0%);
    }
  `;
const animations = {
  fadeIn: () =>
    css`
      ${fadeIn} ${animationDuration} ${easings.outQuadratic} forwards
    `,
  fadeOut: () =>
    css`
      ${fadeOut} ${animationDuration} ${easings.outQuadratic} forwards
    `,
  fadeInGrowX: () =>
    css`
      ${fadeInGrowX} 0.6s ${easings.outQuadratic} forwards
    `,
  fadeInUp: () =>
    css`
      ${fadeInUp} ${animationDuration} ${easings.outQuadratic} forwards
    `,
};
const overflow = {
  x: css`
    overflow-y: hidden;
    overflow-x: scroll;
    will-change: transform;
    &:hover {
      --track-color: ${(p) => p.theme.colors.neutral.c30};
    }
  `,
  y: css`
    overflow-x: hidden;
    overflow-y: scroll;
    will-change: transform;
    &:hover {
      --track-color: ${(p) => p.theme.colors.neutral.c30};
    }
  `,
  yAuto: css`
    overflow-x: hidden;
    overflow-y: auto;
    will-change: transform;
    &:hover {
      --track-color: ${(p) => p.theme.colors.neutral.c30};
    }
  `,
  xy: css`
    overflow: scroll;
    will-change: transform;
    &:hover {
      --track-color: ${(p) => p.theme.colors.neutral.c30};
    }
  `,
  trackSize: 12,
};

interface DefaultTheme {
  theme: "dark" | "light";
  animations: typeof animations;
  transition: typeof transition;
  overflow: typeof overflow;
  sizes: {
    topBarHeight: number;
    sideBarWidth: number;
    drawer: {
      side: {
        big: {
          width: number;
        };
        small: {
          width: number;
        };
      };
      popin: {
        min: {
          height: number;
          width: number;
        };
        max: {
          height: number;
          width: number;
        };
      };
    };
  };
  radii: number[];
  fontFamilies: Record<string, Record<string, Font>>;
  fontSizes: number[];
  space: number[];
  shadows: string[];
  colors: ColorPalette & {
    /**
     * @deprecated Do not use the .palette prefix anymore!
     */
    palette: ColorPalette;
  };
  fontWeights: Record<string, string>;
  breakpoints: Record<screensBreakpoints, string>;
  zIndexes: number[];
}

const theme: DefaultTheme = {
  theme: "light",
  sizes: {
    drawer: {
      side: {
        big: {
          width: 580,
        },
        small: {
          width: 420,
        },
      },
      popin: {
        min: {
          height: 158,
          width: 462,
        },
        max: {
          height: 522,
          width: 622,
        },
      },
    },
    topBarHeight: 58,
    sideBarWidth: 230,
  },
  radii,
  fontFamilies,
  fontSizes,
  fontWeights,
  space,
  shadows,
  colors: {
    palette: palettes.light,
    ...palettes.light,
  },
  animations,
  overflow,
  transition,
  zIndexes,
  breakpoints,
};

export default theme;
export type Theme = DefaultTheme;
