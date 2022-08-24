import { DefaultTheme, css } from "styled-components";

type Props = { theme: DefaultTheme };

export default css`
  .tippy-box[data-animation="fade"][data-state="hidden"] {
    opacity: 0;
  }

  [data-tippy-root] {
    max-width: calc(100vw - 10px);
  }

  .tippy-box {
    position: relative;
    background-color: ${(p: Props) => p.theme.colors.neutral.c100};
    color: ${(p: Props) => p.theme.colors.neutral.c00};
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.4;
    outline: 0;
    transition-property: transform, visibility, opacity;
  }

  .tippy-arrow {
    width: 16px;
    height: 16px;
    color: ${(p: Props) => p.theme.colors.neutral.c100};
  }

  .tippy-arrow:before {
    content: "";
    position: absolute;
    border-color: transparent;
    border-style: solid;
  }

  .tippy-box[data-placement^="top"] > .tippy-arrow {
    bottom: 0;
  }

  .tippy-box[data-placement^="top"] > .tippy-arrow:before {
    bottom: -4px;
    left: 0;
    border-width: 10px 10px 0;
    border-top-color: initial;
    transform-origin: center top;
  }

  .tippy-box[data-placement^="bottom"] > .tippy-arrow {
    top: 0;
  }

  .tippy-box[data-placement^="bottom"] > .tippy-arrow:before {
    top: -4px;
    left: 0;
    border-width: 0 10px 10px;
    border-bottom-color: initial;
    transform-origin: center bottom;
  }

  .tippy-box[data-placement^="left"] > .tippy-arrow {
    right: 0;
  }

  .tippy-box[data-placement^="left"] > .tippy-arrow:before {
    border-width: 10px 0 10px 10px;
    border-left-color: initial;
    right: -4px;
    transform-origin: center left;
  }

  .tippy-box[data-placement^="right"] > .tippy-arrow {
    left: 0;
  }

  .tippy-box[data-placement^="right"] > .tippy-arrow:before {
    left: -4px;
    border-width: 10px 10px 10px 0;
    border-right-color: initial;
    transform-origin: center right;
  }

  .tippy-box[data-inertia][data-state="visible"] {
    transition-timing-function: cubic-bezier(0.54, 1.5, 0.38, 1.11);
  }

  .tippy-content {
    position: relative;
    padding: 8px 10px;
    z-index: 1;
  }
`;
