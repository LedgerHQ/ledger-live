import { TextVariants } from "../../styles/theme";
import { BaseTextProps } from "./index";

export type FontWeightTypes = "medium" | "semiBold" | "bold";

const bracketSizes: Record<TextVariants, number> = {
  h1: 32,
  h2: 28,
  h3: 20,
  h4: 18,
  h5: 18,
  large: 20,
  body: 20,
  bodyLineHeight: 20,
  paragraph: 20,
  paragraphLineHeight: 18,
  small: 16,
  subtitle: 16,
  tiny: 16,
};

export function getBracketSize({ variant }: { variant?: TextVariants }): number {
  return variant ? bracketSizes[variant] : 20;
}

export function getTextTypeStyle({ bracket }: { bracket?: boolean }): Record<
  TextVariants,
  {
    fontFamily: string;
    lineHeight?: string;
    paddingTop?: number;
    textTransform?: string;
  }
> {
  return {
    h1: {
      fontFamily: "Alpha",
      lineHeight: "32px",
      paddingTop: bracket ? 5 : 0,
      textTransform: "uppercase",
    },
    h2: {
      fontFamily: "Alpha",
      lineHeight: "28px",
      paddingTop: bracket ? 3 : 0,
      textTransform: "uppercase",
    },
    h3: {
      fontFamily: "Alpha",
      lineHeight: "20px",
      paddingTop: bracket ? 5 : 0,
      textTransform: "uppercase",
    },
    h4: {
      fontFamily: "Inter",
    },
    h5: {
      fontFamily: "Inter",
    },
    large: {
      fontFamily: "Inter",
    },
    body: {
      fontFamily: "Inter",
    },
    bodyLineHeight: {
      fontFamily: "Inter",
      lineHeight: "20px",
    },
    paragraph: {
      fontFamily: "Inter",
    },
    paragraphLineHeight: {
      fontFamily: "Inter",
      lineHeight: "18px",
    },
    small: {
      fontFamily: "Inter",
    },
    subtitle: {
      fontFamily: "Inter",
      textTransform: "uppercase",
    },
    tiny: {
      fontFamily: "Inter",
    },
  };
}

const getConcatenedFontWeightFontFamily: {
  [index: string]: {
    [index: string]: {
      fontFamily: string;
    };
  };
} = {
  Alpha: {
    medium: {
      fontFamily: "HMAlphaMono-Medium",
    },
    semiBold: {
      fontFamily: "HMAlphaMono-Medium",
    },
    bold: {
      fontFamily: "HMAlphaMono-Medium",
    },
  },
  Inter: {
    medium: {
      fontFamily: "Inter-Medium",
    },
    semiBold: {
      fontFamily: "Inter-SemiBold",
    },
    bold: {
      fontFamily: "Inter-Bold",
    },
  },
};

export function getTextStyle({
  variant = "paragraph",
  bracket = false,
  fontWeight = "medium",
}: Partial<BaseTextProps>): {
  fontFamily: string;
  lineHeight?: string;
  paddingTop?: number;
} {
  const style = getTextTypeStyle({ bracket })[variant];
  return {
    ...style,
    ...getConcatenedFontWeightFontFamily[style?.fontFamily ?? "Inter"][fontWeight],
  };
}
