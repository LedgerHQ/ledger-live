import React from "react";
import styled, { useTheme } from "styled-components/native";
import ShieldSecurityMedium from "@ledgerhq/icons-ui/native/ShieldSecurityMedium";
import CircledCrossMedium from "@ledgerhq/icons-ui/native/CircledCrossMedium";
import CircledAlertMedium from "@ledgerhq/icons-ui/native/CircledAlertMedium";
import Text from "../../Text";
import { getColor } from "../../../styles";
import FlexBox from "../../Layout/Flex";

type AlertType = "info" | "warning" | "error";

export interface AlertProps {
  type?: AlertType;
  title: string;
  showIcon?: boolean;
}

const icons = {
  info: ShieldSecurityMedium,
  warning: CircledAlertMedium,
  error: CircledCrossMedium,
};

const alertColors = {
  info: {
    backgroundColor: "primary.c20",
    color: "primary.c90",
  },
  warning: {
    backgroundColor: "warning.c30",
    color: "warning.c100",
  },
  error: {
    backgroundColor: "error.c30",
    color: "error.c100",
  },
};

const StyledIconContainer = styled.View`
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const StyledAlertContainer = styled(FlexBox).attrs<Partial<AlertProps>>(
  (p) => ({
    backgroundColor: alertColors[p.type || "info"].backgroundColor,
  })
)<Partial<AlertProps>>`
  width: 100%;
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  padding: 16px;
  flex-direction: row;
  align-items: center;
`;

export default function Alert({
  type = "info",
  title,
  showIcon = true,
}: AlertProps): JSX.Element {
  const theme = useTheme();
  const textColor = getColor(theme, alertColors[type || "info"].color);
  return (
    <StyledAlertContainer type={type}>
      {showIcon && !!icons[type] && (
        <StyledIconContainer>
          {icons[type || "info"]({ size: 20, color: textColor })}
        </StyledIconContainer>
      )}
      <Text color={textColor} flexShrink={1}>
        {title}
      </Text>
    </StyledAlertContainer>
  );
}
