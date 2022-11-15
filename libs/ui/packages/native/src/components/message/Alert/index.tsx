import React from "react";
import styled, { useTheme } from "styled-components/native";
import InfoMedium from "@ledgerhq/icons-ui/native/InfoMedium";
import CircledCrossMedium from "@ledgerhq/icons-ui/native/CircledCrossMedium";
import CircledAlertMedium from "@ledgerhq/icons-ui/native/CircledAlertMedium";
import Text from "../../Text";
import { getColor } from "../../../styles";
import FlexBox from "../../Layout/Flex";

type AlertType = "info" | "warning" | "error";

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
  /**
   * Alternative to using the `children` prop in order to render something using the value of `textColor`
   * that is passed as a parameter.
   */
  renderContent?: ({ textColor }: { textColor: string }) => React.ReactNode | null;
}

const icons = {
  info: InfoMedium,
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
  (p: Partial<AlertProps>) => ({
    backgroundColor: alertColors[p.type || "info"].backgroundColor,
  }),
)<Partial<AlertProps>>`
  width: 100%;
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  padding: 16px;
  flex-direction: row;
  align-items: center;
`;

export default function Alert({
  type = "info",
  Icon,
  title,
  showIcon = true,
  children,
  renderContent,
}: AlertProps): JSX.Element {
  const theme = useTheme();
  const textColor = getColor(theme, alertColors[type || "info"].color);
  const iconProps = { size: 20, color: textColor };
  return (
    <StyledAlertContainer type={type}>
      {showIcon && !!icons[type] && (
        <StyledIconContainer>
          {Icon ? <Icon {...iconProps} /> : icons[type || "info"](iconProps)}
        </StyledIconContainer>
      )}
      {title && (
        <Text color={textColor} flexShrink={1}>
          {title}
        </Text>
      )}
      {children}
      {renderContent && renderContent({ textColor })}
    </StyledAlertContainer>
  );
}
