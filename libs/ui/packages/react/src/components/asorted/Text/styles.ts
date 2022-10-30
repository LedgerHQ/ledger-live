import { GlobalStyleProps } from "../../../styles/global";
import { css } from "styled-components";
import { TextVariants } from "../../../styles/theme";

const getFontSource = (name: string) => (props: GlobalStyleProps) => {
  const fontsPath = props.fontsPath ?? "assets/fonts";
  const fontName = (props.fontMappings && props.fontMappings(name)) || `${name}.woff2`;
  return `url("${fontsPath}/${fontName}") format("woff2")`;
};

export const fontStyles = css`
  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-ExtraLight-BETA")};
    font-weight: 100;
    font-style: normal;
  }

  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-Light-BETA")};
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-Regular")};
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-Medium")};
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-SemiBold")};
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: "Inter";
    src: ${getFontSource("Inter-ExtraBold")};
    font-weight: 900;
    font-style: normal;
  }

  @font-face {
    font-family: "Alpha";
    src: ${getFontSource("HMAlphaMono-Medium")};
    font-weight: 500;
    font-style: normal;
  }
`;

export const textVariantStyle: Record<
  TextVariants,
  {
    fontFamily: string;
    lineHeight?: string | number;
    fontWeight?: number;
    "text-transform"?: string;
  }
> = {
  h1: {
    fontFamily: "Alpha, Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h1Inter: {
    fontFamily: "Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h2: {
    fontFamily: "Alpha, Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h2Inter: {
    fontFamily: "Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h3: {
    fontFamily: "Alpha, Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h3Inter: {
    fontFamily: "Inter, Sans",
    fontWeight: 500,
  },
  h4: {
    fontFamily: "Alpha, Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h4Inter: {
    fontFamily: "Inter, Sans",
    fontWeight: 600,
  },
  h5: {
    fontFamily: "Alpha, Inter, Sans",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h5Inter: {
    fontFamily: "Inter, Sans",
    fontWeight: 500,
  },
  large: {
    fontFamily: "Inter, Sans",
  },
  largeLineHeight: {
    fontFamily: "Inter, Sans",
    lineHeight: 1.7,
  },
  body: {
    fontFamily: "Inter, Sans",
  },
  bodyLineHeight: {
    fontFamily: "Inter, Sans",
    lineHeight: 1.7,
  },
  paragraph: {
    fontFamily: "Inter, Sans",
  },
  paragraphLineHeight: {
    fontFamily: "Inter, Sans",
    lineHeight: 1.7,
  },
  small: {
    fontFamily: "Inter, Sans",
  },
  extraSmall: {
    fontFamily: "Inter, Sans",
  },
  tiny: {
    fontFamily: "Inter, Sans",
  },
  micro: {
    fontFamily: "Inter, Sans",
  },
  subtitle: {
    fontFamily: "Inter, Sans",
    fontWeight: 600,
    "text-transform": "uppercase",
  },
};
