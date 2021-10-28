import { GlobalStyleProps } from "../../../styles/global";
import { css } from "styled-components";

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

export default css`
  .ll-text_h1 {
    font-family: Alpha, Arial;
    font-size: 36px;
    line-height: 43.2px;
  }
  .ll-text_h2 {
    font-family: Alpha, Arial;
    font-size: 28px;
    line-height: 33.6px;
  }
  .ll-text_h3 {
    font-family: Alpha, Arial;
    font-size: 20px;
    line-height: 24px;
  }
  .ll-text_h3 {
    font-family: Alpha, Arial;
    font-size: 20px;
    line-height: 24px;
  }
  .ll-text_large {
    font-family: Inter, Arial;
    font-size: 16px;
    line-height: normal;
  }
  .ll-text_highlight {
    font-family: Inter, Arial;
    font-size: 16px;
    line-height: 19.36px;
  }
  .ll-text_emphasis {
    font-family: Inter, Arial;
    font-size: 14px;
    line-height: 20px;
  }
  .ll-text_body {
    font-family: Inter, Arial;
    font-size: 13px;
    line-height: 20px;
  }
  .ll-text_cta {
    font-family: Inter, Arial;
    font-size: 13px;
    line-height: 15.73px;
  }
  .ll-text_link {
    font-family: Inter, Arial;
    font-size: 13px;
    line-height: 16px;
    text-decoration: underline;
    cursor: pointer;
  }
  .ll-text_small {
    font-family: Inter, Arial;
    font-size: 12px;
    line-height: normal;
  }
  .ll-text_tiny {
    font-family: Inter, Arial;
    font-size: 12px;
    line-height: 16px;
  }
  .ll-text_navigation {
    font-family: Inter, Arial;
    font-size: 12px;
    line-height: 14.52px;
  }
  .ll-text_subTitle {
    font-family: Inter, Arial;
    font-size: 11px;
    line-height: 13.31px;
  }
  .ll-text_tag {
    font-family: Inter, Arial;
    font-size: 10px;
    line-height: 12.1px;
  }
  .ll-text_paragraph {
    font-family: Inter, Arial;
    font-size: 13px;
  }
`;
