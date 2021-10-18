import React from "react";
import styled from "styled-components";
import { color, ColorProps } from "styled-system";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import Icon from "../../asorted/Icon";
import Badge from "./Badge";

export type Props = {
  /* The title to be displayed. */
  title: string;
  /* JSX that should be rendered by a call to the <Notification.Badge /> component.*/
  badge: React.ReactNode;
  /* An optional description. */
  description?: string;
  /* An optional link. */
  link?: string;
  /* A callback to perform when clicking on the link. */
  onLinkClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
} & ColorProps &
  React.ComponentProps<typeof Container>;

const Container = styled(FlexBox).attrs({
  p: 6,
  columnGap: 8,
  alignItems: "center",
})`
  border-radius: 8px;
  ${color}
`;

const Link = styled(Text).attrs({
  ff: "Inter|SemiBold",
  fontSize: 4,
  color: "palette.neutral.c100",
})`
  display: inline-flex;
  align-items: center;
  column-gap: 6px;
  cursor: pointer;

  :hover,
  :focus,
  :active {
    text-decoration: underline;
  }
`;

function Notification({
  title,
  description,
  badge,
  link,
  onLinkClick,
  ...containerProps
}: Props): JSX.Element {
  return (
    <Container {...containerProps}>
      {badge}
      <FlexBox flexDirection="column" rowGap={3} flex="auto">
        <Text ff="Inter|Medium" fontSize={5} color="palette.neutral.c100">
          {title}
        </Text>
        {description && (
          <Text ff="Inter|Medium" fontSize={4} color="palette.neutral.c80">
            {description}
          </Text>
        )}
        {link && (
          <Link
            onClick={(event: React.MouseEvent<HTMLSpanElement>) =>
              onLinkClick && onLinkClick(event)
            }
          >
            {link}
            <Icon name="ExternalLink" size={18} />
          </Link>
        )}
      </FlexBox>
    </Container>
  );
}
Notification.Badge = Badge;

export type NotificationType = { (p: Props): JSX.Element; Badge: typeof Badge };
export default Notification as NotificationType;
