import React from "react";
import styled from "styled-components";
import FlexBox, { FlexBoxProps } from "../../layout/Flex";
import Text from "../../asorted/Text";
import Badge from "./Badge";
import Link, { LinkProps } from "../../cta/Link";
import { ExternalLinkMedium } from "@ledgerhq/icons-ui/reactLegacy";

interface ContainerProps extends FlexBoxProps {
  /* Add the pre-selected background. */
  hasBackground?: boolean;
}

export interface Props extends ContainerProps {
  /* The title to be displayed. */
  title: string;
  /* JSX that should be rendered by a call to the <Notification.Badge /> component.*/
  badge: React.ReactNode;
  /* An optional description. */
  description?: string;
  /* An optional link. */
  link?: string;
  /* A callback to perform when clicking on the link. */
  onLinkClick?: LinkProps["onClick"];
}

const Container = styled(FlexBox).attrs<ContainerProps>({
  p: 6,
  columnGap: 8,
  alignItems: "center",
})<ContainerProps>`
  --notification-badge-border: ${p => {
    /* Set a CSS variable that will be consumed by the Badge component */
    return p.hasBackground ? p.theme.colors.neutral.c30 : p.theme.colors.background.main;
  }};
  background-color: ${p => (p.hasBackground ? p.theme.colors.neutral.c30 : "transparent")};

  border-radius: 8px;
`;

function Notification({
  title,
  description,
  badge,
  link,
  onLinkClick,
  hasBackground = false,
  ...containerProps
}: Props): JSX.Element {
  return (
    <Container hasBackground={hasBackground} {...containerProps}>
      {badge}
      <FlexBox flexDirection="column" rowGap={3} flex="auto">
        <Text variant={"large"} fontWeight="medium" color="neutral.c100">
          {title}
        </Text>
        {description && (
          <Text variant={"paragraph"} fontWeight="medium" color="neutral.c80" whiteSpace="pre-wrap">
            {description}
          </Text>
        )}
        {link && (
          <FlexBox justifyContent={"flex-start"}>
            <Link onClick={event => onLinkClick && onLinkClick(event)} Icon={ExternalLinkMedium}>
              {link}
            </Link>
          </FlexBox>
        )}
      </FlexBox>
    </Container>
  );
}
Notification.Badge = Badge;

export type NotificationType = { (p: Props): JSX.Element; Badge: typeof Badge };
export default Notification as NotificationType;
