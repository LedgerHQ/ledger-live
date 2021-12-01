import React from "react";
import styled, { useTheme } from "styled-components";
import Text from "../../asorted/Text";
import { TextVariants } from "../../../styles/theme";
import Flex from "../../layout/Flex";
import ShieldSecurityMedium from "@ledgerhq/icons-ui/react/ShieldSecurityMedium";
import CircledCrossMedium from "@ledgerhq/icons-ui/react/CircledCrossMedium";
import CircledAlertMedium from "@ledgerhq/icons-ui/react/CircledAlertMedium";
import { DefaultTheme } from "styled-components/native";

type AlertType = "info" | "warning" | "error";
export interface AlertProps {
  /**
   * Affects the colors of the background & text and what icon can be displayed
   */
  type?: AlertType;
  /**
   * Title of the Alert
   */
  title?: string;
  /**
   * Method for rendering additional content under the title `{ color: string; textProps: { variant?: TextVariants; fontWeight?: string } }` is passed as props to easily style text elements
   */
  renderContent?: (props: {
    color: string;
    textProps: { variant?: TextVariants; fontWeight?: string };
  }) => JSX.Element;
  /**
   * Whether or not to display an icon
   */
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

const getColors = ({ theme, type }: { theme: DefaultTheme; type?: AlertType }) => {
  switch (type) {
    case "warning":
      return {
        background: theme.colors.warning.c30,
        color: theme.colors.warning.c100,
      };
    case "error":
      return {
        background: theme.colors.error.c30,
        color: theme.colors.error.c100,
      };
    case "info":
    default:
      return {
        background: theme.colors.primary.c20,
        color: theme.colors.primary.c90,
      };
  }
};

const StyledAlertContainer = styled(Flex).attrs(() => ({
  padding: 6,
}))<{ background?: string; color?: string }>`
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  align-items: center;
`;

export default function Alert({
  type = "info",
  title,
  showIcon = true,
  renderContent,
}: AlertProps): JSX.Element {
  const theme = useTheme();
  const { color, background } = getColors({ theme, type });
  const textProps: { variant?: TextVariants; fontWeight?: string } = {
    variant: "paragraph",
    fontWeight: "medium",
  };
  return (
    <StyledAlertContainer color={color} backgroundColor={background}>
      {showIcon && !!icons[type] && <StyledIconContainer>{icons[type]}</StyledIconContainer>}
      <Flex flexDirection="column" alignItems="flex-start" rowGap="6px">
        {title && (
          <Text {...textProps} color="inherit">
            {title}
          </Text>
        )}
        {renderContent && renderContent({ color, textProps })}
      </Flex>
    </StyledAlertContainer>
  );
}
