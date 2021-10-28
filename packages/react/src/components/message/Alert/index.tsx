import React from "react";
import styled, { css } from "styled-components";
import Text from "../../asorted/Text";
import ShieldSecurityMedium from "@ledgerhq/icons-ui/react/ShieldSecurityMedium";
import CircledCrossMedium from "@ledgerhq/icons-ui/react/CircledCrossMedium";
import CircledAlertMedium from "@ledgerhq/icons-ui/react/CircledAlertMedium";

type AlertType = "info" | "warning" | "error";

export interface AlertProps {
  type?: AlertType;
  title: string;
  showIcon?: boolean;
}

const StyledIconContainer = styled.div`
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const icons = {
  info: <ShieldSecurityMedium size={20} />,
  warning: <CircledAlertMedium size={20} />,
  error: <CircledCrossMedium size={20} />,
};

const StyledAlertContainer = styled.div<{ type?: AlertType }>`
  ${(p) => {
    switch (p.type) {
      case "warning":
        return css`
          background: ${p.theme.colors.palette.warning.c30};
          color: ${p.theme.colors.palette.warning.c100};
        `;
      case "error":
        return css`
          background: ${p.theme.colors.palette.error.c30};
          color: ${p.theme.colors.palette.error.c100};
        `;
      case "info":
      default:
        return css`
          background: ${p.theme.colors.palette.primary.c20};
          color: ${p.theme.colors.palette.primary.c90};
        `;
    }
  }}

  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  padding: 16px;
  display: flex;
  align-items: center;
`;

export default function Alert({ type = "info", title, showIcon = true }: AlertProps): JSX.Element {
  return (
    <StyledAlertContainer type={type}>
      {showIcon && !!icons[type] && <StyledIconContainer>{icons[type]}</StyledIconContainer>}
      <Text type={"body"} color={"inherit"}>
        {title}
      </Text>
    </StyledAlertContainer>
  );
}
