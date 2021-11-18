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
    fontFamily: "Alpha",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h2: {
    fontFamily: "Alpha",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h3: {
    fontFamily: "Alpha",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h4: {
    fontFamily: "Alpha",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  h5: {
    fontFamily: "Alpha",
    fontWeight: 500,
    "text-transform": "uppercase",
  },
  large: {
    fontFamily: "Inter",
  },
  largeLineHeight: {
    fontFamily: "Inter",
    lineHeight: 1.7,
  },
  body: {
    fontFamily: "Inter",
  },
  bodyLineHeight: {
    fontFamily: "Inter",
    lineHeight: 1.7,
  },
  paragraph: {
    fontFamily: "Inter",
  },
  paragraphLineHeight: {
    fontFamily: "Inter",
    lineHeight: 1.7,
  },
  small: {
    fontFamily: "Inter",
  },
  extraSmall: {
    fontFamily: "Inter",
  },
  tiny: {
    fontFamily: "Inter",
  },
  micro: {
    fontFamily: "Inter",
  },
  subtitle: {
    fontFamily: "Inter",
    fontWeight: 600,
    "text-transform": "uppercase",
  },
};
