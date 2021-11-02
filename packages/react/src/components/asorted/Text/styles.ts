import { GlobalStyleProps } from "../../../styles/global";
import { css } from "styled-components";
import { TextVariants } from "../../../styles/theme";

const getFontSource = (name: string) => (props: GlobalStyleProps) => {
  const fontsPath = props.fontsPath || "assets/fonts";
  return `url("${fontsPath}/${name}.woff2") format("woff2")`;
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
    lineHeight?: string;
    fontWeight?: number;
  }
> = {
  h1: {
    fontFamily: "Alpha",
    fontWeight: 500,
  },
  h2: {
    fontFamily: "Alpha",
    fontWeight: 500,
  },
  h3: {
    fontFamily: "Alpha",
    fontWeight: 500,
  },
  h4: {
    fontFamily: "Inter",
    fontWeight: 500,
  },
  h5: {
    fontFamily: "Alpha",
    fontWeight: 500,
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
  extraSmall: {
    fontFamily: "Inter",
  },
  subtitle: {
    fontFamily: "Inter",
    fontWeight: 600,
  },
  tiny: {
    fontFamily: "Inter",
  },
  micro: {
    fontFamily: "Inter",
  },
};
