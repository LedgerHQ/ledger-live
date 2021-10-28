export type TextTypes =
  | "h1"
  | "h2"
  | "h3"
  | "emphasis"
  | "body"
  | "link"
  | "subTitle"
  | "small"
  | "tag"
  | "large"
  | "paragraph";

export type FontWeightTypes = "medium" | "semibold" | "bold";

export function getTextTypeStyle({ bracket }: { bracket?: boolean }): {
  [index: string]: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    paddingTop?: number;
  };
} {
  return {
    h1: {
      fontFamily: "Alpha",
      fontSize: 36,
      lineHeight: 43.2,
      paddingTop: bracket ? 15 : 0,
    },
    h2: {
      fontFamily: "Alpha",
      fontSize: 28,
      lineHeight: 33.6,
      paddingTop: bracket ? 10 : 0,
    },
    h3: {
      fontFamily: "Alpha",
      fontSize: 20,
      lineHeight: 24,
      paddingTop: bracket ? 5 : 0,
    },
    large: {
      fontFamily: "Inter",
      fontSize: 16,
      lineHeight: 19.36,
    },
    emphasis: {
      fontFamily: "Inter",
      fontSize: 14,
      lineHeight: 20,
    },
    body: {
      fontFamily: "Inter",
      fontSize: 14,
      lineHeight: 20,
    },
    paragraph: {
      fontFamily: "Inter",
      fontSize: 13,
      lineHeight: 15.73,
    },
    link: {
      fontFamily: "Inter",
      fontSize: 13,
      lineHeight: 16,
    },
    tiny: {
      fontFamily: "Inter",
      fontSize: 12,
      lineHeight: 16,
    },
    navigation: {
      fontFamily: "Inter",
      fontSize: 12,
      lineHeight: 14.52,
    },
    subTitle: {
      fontFamily: "Inter",
      fontSize: 11,
      lineHeight: 13.31,
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
  },
  Inter: {
    medium: {
      fontFamily: "Inter-Medium",
    },
    semibold: {
      fontFamily: "Inter-SemiBold",
    },
    bold: {
      fontFamily: "Inter-Bold",
    },
  },
};

export function getTextStyle({
  type = "body",
  bracket,
  fontWeight = "medium",
}: {
  type?: TextTypes;
  bracket?: boolean;
  fontWeight?: FontWeightTypes;
}): {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  paddingTop?: number;
} {
  const style = getTextTypeStyle({ bracket })[type];
  return {
    ...style,
    ...getConcatenedFontWeightFontFamily[style.fontFamily || "Inter"][
      fontWeight
    ],
  };
}
