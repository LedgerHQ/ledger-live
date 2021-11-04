import { TextVariants } from "../../styles/theme";
import { BaseTextProps } from "./index";

export type FontWeightTypes = "medium" | "semiBold" | "bold";

export function getTextTypeStyle({ bracket }: { bracket?: boolean }): Record<
  TextVariants,
  {
    fontFamily: string;
    lineHeight?: number;
    paddingTop?: number;
  }
> {
  return {
    h1: {
      fontFamily: "Alpha",
      lineHeight: 32,
      paddingTop: bracket ? 15 : 0,
    },
    h2: {
      fontFamily: "Alpha",
      lineHeight: 28,
      paddingTop: bracket ? 10 : 0,
    },
    h3: {
      fontFamily: "Alpha",
      lineHeight: 20,
      paddingTop: bracket ? 5 : 0,
    },
    h4: {
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
      lineHeight: 20,
    },
    paragraph: {
      fontFamily: "Inter",
    },
    paragraphLineHeight: {
      fontFamily: "Inter",
      lineHeight: 18,
    },
    small: {
      fontFamily: "Inter",
    },
    subtitle: {
      fontFamily: "Inter",
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
  lineHeight?: number;
  paddingTop?: number;
} {
  const style = getTextTypeStyle({ bracket })[variant];
  return {
    ...style,
    ...getConcatenedFontWeightFontFamily[style?.fontFamily ?? "Inter"][
      fontWeight
    ],
  };
}
