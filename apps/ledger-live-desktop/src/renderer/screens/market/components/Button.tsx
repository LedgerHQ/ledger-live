import React from "react";
import { Button as BaseButton } from "@ledgerhq/react-ui";
import styled from "styled-components";

export const Button = styled(BaseButton)<{ big?: boolean }>`
  ${p =>
    p.Icon
      ? `
      height: 40px;
      width: 40px;
      `
      : `
          font-size:  ${p.big ? 14 : 12}px;
          height: ${p.big ? 48 : 32}px;
          line-height: ${p.big ? 48 : 32}px;
          padding: 0 ${p.big ? 25 : 15}px;
      `}

  ${p =>
    p.variant === "shade"
      ? `background-color: transparent!important;border-color: currentColor;`
      : ``}
`;
