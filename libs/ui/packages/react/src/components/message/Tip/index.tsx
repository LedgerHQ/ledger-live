import React from "react";
import styled, { css } from "styled-components";
import Text from "../../asorted/Text";
import { CheckAloneMedium, CloseMedium, CircledAlertMedium } from "@ledgerhq/icons-ui/reactLegacy";
import { Flex } from "../../layout";

type TipType = "success" | "warning" | "error";

export interface TipProps {
  type?: TipType;
  label: string;
}

const icons = {
  success: <CheckAloneMedium size={16} />,
  warning: <CircledAlertMedium size={16} />,
  error: <CloseMedium size={16} />,
};

const StyledIconContainer = styled.div<{ type?: TipType }>`
  ${p => {
    switch (p.type) {
      case "warning":
        return css`
          background: ${p.theme.colors.warning.c10};
          color: ${p.theme.colors.warning.c50};
        `;
      case "error":
        return css`
          background: ${p.theme.colors.error.c10};
          color: ${p.theme.colors.error.c50};
        `;
      case "success":
      default:
        return css`
          background: ${p.theme.colors.success.c30};
          color: ${p.theme.colors.success.c50};
        `;
    }
  }}

  border-radius: ${p => `${p.theme.radii[1]}px`};
  margin-right: ${p => `${p.theme.space[6]}px`};
  padding: 6px;
  display: flex;
  align-items: center;
`;

export default function Tip({ type, label }: TipProps): JSX.Element {
  return (
    <Flex alignItems={"center"}>
      {type && <StyledIconContainer type={type}>{icons[type]}</StyledIconContainer>}
      <Text variant={"paragraph"} fontWeight={"medium"} color={"neutral.c100"} flexShrink={1}>
        {label}
      </Text>
    </Flex>
  );
}
