import React from "react";
import styled, { useTheme } from "styled-components/native";
import InfoAltFillMedium from "@ledgerhq/icons-ui/native/InfoAltFillMedium";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/native/CircledCheckSolidMedium";
import WarningSolidMedium from "@ledgerhq/icons-ui/native/WarningSolidMedium";
import CircledCrossSolidMedium from "@ledgerhq/icons-ui/native/CircledCrossSolidMedium";

import Text from "../../Text";
import FlexBox from "../../Layout/Flex";
import { getColor } from "../../../styles";

type AlertType = "info" | "secondary" | "success" | "warning" | "error";

export type IconProps = { size?: number; color?: string };
export type IconType = React.ComponentType<IconProps>;
export interface AlertProps {
  type?: AlertType;
  /**
   * Optional component to replace the default Icon for the given `type` prop.
   * It will receive a `color: string` and a `size: number` as props.
   * */
  Icon?: IconType;
  title?: React.ReactNode;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const icons: Record<AlertType, IconType> = {
  info: InfoAltFillMedium,
  secondary: InfoAltFillMedium,
  success: CircledCheckSolidMedium,
  warning: WarningSolidMedium,
  error: CircledCrossSolidMedium,
};

const alertColors: Record<AlertType, { backgroundColor: string; iconColor: string }> = {
  info: {
    backgroundColor: "primary.c10",
    iconColor: "primary.c80",
  },
  secondary: {
    backgroundColor: "opacityDefault.c05",
    iconColor: "neutral.c80",
  },
  success: {
    backgroundColor: "success.c10",
    iconColor: "success.c50",
  },
  warning: {
    backgroundColor: "warning.c10",
    iconColor: "warning.c70",
  },
  error: {
    backgroundColor: "error.c10",
    iconColor: "error.c50",
  },
};

const StyledIconContainer = styled(FlexBox).attrs({
  mr: 4,
  alignItems: "center",
})``;

const StyledAlertContainer = styled(FlexBox).attrs<Partial<AlertProps>>(
  (p: Partial<AlertProps>) => ({
    backgroundColor: alertColors[p.type || "info"].backgroundColor,
    p: 6,
  }),
)<Partial<AlertProps>>`
  width: 100%;
  border-radius: ${(p) => `${p.theme.radii[2]}px`};
  flex-direction: row;
  align-items: flex-start;
`;

const AlertBodyText = styled(Text).attrs({
  flexShrink: 1,
  variant: "bodyLineHeight",
  fontWeight: "semiBold",
})``;

const AlertUnderlinedText = styled(AlertBodyText)`
  text-decoration-line: underline;
`;

function Alert({ type = "info", Icon, title, showIcon = true, children }: AlertProps): JSX.Element {
  const theme = useTheme();
  const textColor = "neutral.c100";
  const IconComponent = Icon ?? icons[type];
  return (
    <StyledAlertContainer type={type}>
      {showIcon && !!icons[type] && (
        <StyledIconContainer>
          <IconComponent size={20} color={getColor(theme, alertColors[type || "info"].iconColor)} />
        </StyledIconContainer>
      )}
      {title ? (
        <Text color={textColor} flexShrink={1} variant="bodyLineHeight" fontWeight="semiBold">
          {title}
        </Text>
      ) : null}
      {children}
    </StyledAlertContainer>
  );
}

Alert.BodyText = AlertBodyText;
Alert.UnderlinedText = AlertUnderlinedText;

export default Alert;
