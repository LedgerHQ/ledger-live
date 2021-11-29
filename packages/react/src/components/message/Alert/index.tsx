import React from "react";
import styled, { css, useTheme } from "styled-components";
import Text from "../../asorted/Text";
import Flex from "../../layout/Flex";
import ShieldSecurityMedium from "@ledgerhq/icons-ui/react/ShieldSecurityMedium";
import CircledCrossMedium from "@ledgerhq/icons-ui/react/CircledCrossMedium";
import CircledAlertMedium from "@ledgerhq/icons-ui/react/CircledAlertMedium";
import { DefaultTheme } from "styled-components/native";

type AlertType = "info" | "warning" | "error";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  renderContent?: (props: { color: string }) => JSX.Element;
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

const StyledAlertContainer = styled.div<{ type?: AlertType }>`
  ${(p) => {
    const { background, color } = getColors({ theme: p.theme, type: p.type });
    return css`
      background: ${background};
      color: ${color};
    `;
  }}
  word-break: break-all;

  border-radius: ${(p) => `${p.theme.radii[1]}px`};
  padding: 16px;
  display: flex;
  align-items: center;
`;

const ContentContainer = styled(Flex)`
  flex-direction: column;
`;

export default function Alert({
  type = "info",
  title,
  showIcon = true,
  renderContent,
}: AlertProps): JSX.Element {
  const theme = useTheme();
  const { color } = getColors({ theme, type });
  return (
    <StyledAlertContainer type={type}>
      {showIcon && !!icons[type] && <StyledIconContainer>{icons[type]}</StyledIconContainer>}
      <ContentContainer rowGap="6px">
        {title && (
          <Text variant="paragraph" fontWeight="medium" color="inherit">
            {title}
          </Text>
        )}
        {renderContent && renderContent({ color })}
      </ContentContainer>
    </StyledAlertContainer>
  );
}
