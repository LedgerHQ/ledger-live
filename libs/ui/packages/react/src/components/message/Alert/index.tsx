import React from "react";
import styled, { useTheme, DefaultTheme } from "styled-components";
import Text from "../../asorted/Text";
import { TextVariants } from "../../../styles/theme";
import Flex from "../../layout/Flex";
import InfoAltFillMedium from "@ledgerhq/icons-ui/react/InfoAltFillMedium";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/react/CircledCheckSolidMedium";
import WarningSolidMedium from "@ledgerhq/icons-ui/react/WarningSolidMedium";
import CircledCrossSolidMedium from "@ledgerhq/icons-ui/react/CircledCrossSolidMedium";

type AlertType = "info" | "secondary" | "success" | "warning" | "error";

type RenderProps = (props: {
  textProps: { variant?: TextVariants; fontWeight?: string };
}) => JSX.Element;

export interface AlertProps {
  /**
   * Affects the colors of the background & text and what icon can be displayed.
   */
  type?: AlertType;
  /**
   * Title of the Alert.
   */
  title?: string;
  /**
   * Method for rendering additional content under the title. `{ color: string; textProps: { variant?: TextVariants; fontWeight?: string } }` is passed as props to easily style text elements.
   */
  renderContent?: RenderProps;

  /**
   * Method for rendering additional content to the right. `{ color: string; textProps: { variant?: TextVariants; fontWeight?: string } }` is passed as props to easily style text elements.
   */
  renderRight?: RenderProps;

  /**
   * Additional props to be passed to the top level container (containing icon + content).
   */
  containerProps?: Record<string, unknown>;

  /**
   * Whether or not to display an icon
   */
  showIcon?: boolean;
}

const StyledIconContainer = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
`;

const icons = {
  info: <InfoAltFillMedium size={24} />,
  secondary: <InfoAltFillMedium size={24} />,
  success: <CircledCheckSolidMedium size={24} />,
  warning: <WarningSolidMedium size={24} />,
  error: <CircledCrossSolidMedium size={24} />,
};

const getColors = ({ theme, type }: { theme: DefaultTheme; type?: AlertType }) => {
  switch (type) {
    case "secondary":
      return {
        background: theme.colors.opacityDefault.c05,
        iconColor: theme.colors.neutral.c80,
      };
    case "success":
      return {
        background: theme.colors.success.c10,
        iconColor: theme.colors.success.c50,
      };
    case "warning":
      return {
        background: theme.colors.warning.c10,
        iconColor: theme.colors.warning.c70,
      };
    case "error":
      return {
        background: theme.colors.error.c10,
        iconColor: theme.colors.error.c50,
      };
    case "info":
    default:
      return {
        background: theme.colors.primary.c10,
        iconColor: theme.colors.primary.c80,
      };
  }
};

const StyledAlertContainer = styled(Flex)<{ background?: string; color?: string }>`
  border-radius: ${p => `${p.theme.radii[2]}px`};
  align-items: start;
`;

const AlertBodyText = styled(Text).attrs({
  flexShrink: 1,
  variant: "bodyLineHeight",
  fontWeight: "semiBold",
})``;

const AlertUnderlinedText = styled(AlertBodyText)`
  text-decoration-line: underline;
`;

function Alert({
  type = "info",
  title,
  showIcon = true,
  renderContent,
  renderRight,
  containerProps,
}: AlertProps): JSX.Element {
  const theme = useTheme();
  const { iconColor, background } = getColors({ theme, type });
  const textProps: { variant?: TextVariants; fontWeight?: string } = {
    variant: "bodyLineHeight",
    fontWeight: "semiBold",
  };
  const textColor = "neutral.c100";
  return (
    <StyledAlertContainer
      color={textColor}
      backgroundColor={background}
      padding={6}
      {...containerProps}
    >
      {showIcon && !!icons[type] && (
        <Flex color={iconColor}>
          <StyledIconContainer>{icons[type]}</StyledIconContainer>
        </Flex>
      )}
      <Flex flexDirection="column" flex={1} alignItems="flex-start" rowGap="6px">
        {title && (
          <Text {...textProps} color={textColor}>
            {title}
          </Text>
        )}
        {renderContent && renderContent({ textProps })}
      </Flex>
      <Flex alignSelf="center">{renderRight && renderRight({ textProps })}</Flex>
    </StyledAlertContainer>
  );
}

Alert.BodyText = AlertBodyText;
Alert.UnderlinedText = AlertUnderlinedText;

export default Alert;
