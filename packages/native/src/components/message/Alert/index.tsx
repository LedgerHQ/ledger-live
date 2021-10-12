import React from "react";
import styled, { useTheme } from "styled-components/native";
import ShieldSecurityMedium from "@ui/assets/icons/ShieldSecurityMedium";
import CircledCrossMedium from "@ui/assets/icons/CircledCrossMedium";
import CircledAlertMedium from "@ui/assets/icons/CircledAlertMedium";
import Text from "@components/Text";
import { getColor } from "@ui/styles";
import FlexBox from "@components/Layout/Flex";

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
    backgroundColor: "palette.primary.c20",
    color: "palette.primary.c90",
  },
  warning: {
    backgroundColor: "palette.warning.c30",
    color: "palette.warning.c100",
  },
  error: {
    backgroundColor: "palette.error.c30",
    color: "palette.error.c100",
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
  border-radius: 4px;
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
      <Text color={textColor}>{title}</Text>
    </StyledAlertContainer>
  );
}
