import React, { type ReactEventHandler, type ReactNode } from "react";
import styled, { css } from "styled-components";

import { Icons } from "../../../../assets";
import { Text } from "../../../asorted";
import { Link } from "../../../cta";
import type { Props as GridBoxProps } from "../../Grid";
import { Grid, Flex } from "../..";

type IconKey = keyof typeof Icons;

export type NotificationCardProps = GridBoxProps & {
  title?: string;
  cta?: string;
  description?: ReactNode;
  icon: IconKey;
  isHighlighted?: boolean;

  onClick: ReactEventHandler;
};

const colorsByIcon: Partial<
  Record<IconKey, Partial<{ icon: string; iconBg: string; cta: string }>>
> = {
  Warning: {
    icon: "warning.c80",
    iconBg: "warning.c30",
    cta: "warning.c80",
  },
};

export default function NotificationCard({
  title,
  cta,
  icon,
  description,
  isHighlighted,
  onClick,
  ...boxProps
}: NotificationCardProps) {
  const handleCTAClick: ReactEventHandler = event => {
    event.stopPropagation();
    onClick(event);
  };

  const safeIcon: IconKey = icon in Icons ? icon : "Information";
  const Icon = Icons[safeIcon];
  const colors = colorsByIcon[safeIcon];
  const ctaColor = isHighlighted ? colors?.cta ?? "primary.c80" : "neutral.c100";
  const iconColor = colors?.icon ?? "primary.c80";
  const iconBgColor = colors?.iconBg ?? "opacityPurple.c10";

  return (
    <Wrapper {...boxProps} isHighlighted={isHighlighted} onClick={handleCTAClick}>
      <IconWrapper backgroundColor={iconBgColor} isHighlighted={isHighlighted}>
        <Icon color={iconColor} />
      </IconWrapper>
      <Flex flexDirection="column" rowGap={isHighlighted ? "4px" : "8px"}>
        {title && (
          <Text variant="h4Inter" fontSize={16}>
            {title}
          </Text>
        )}
        {description && (
          <Desc color={isHighlighted ? "neutral.c100" : "neutral.c80"}>{description}</Desc>
        )}
        {cta && (
          <Cta color={ctaColor} onClick={handleCTAClick}>
            {cta}
          </Cta>
        )}
      </Flex>
    </Wrapper>
  );
}

const Desc = styled(Text).attrs({ variant: "small" })`
  font-family: Inter;
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
`;

const Cta = styled(Link).attrs({ alignSelf: "start" })`
  font-size: 13px;
`;

const IconWrapper = styled(Flex)<Pick<NotificationCardProps, "isHighlighted">>`
  border-radius: ${p => (p.isHighlighted ? "13.5px" : "50%")};
  padding: 8px;
  ${p =>
    p.isHighlighted &&
    css`
      background-clip: padding-box;
      border-width: 7px;
      border-style: solid;
      border-color: transparent;
      position: relative;
      &::before {
        content: "";
        position: absolute;
        inset: -7px;
        border-radius: 13.5px;
        background: linear-gradient(
          180deg,
          ${p.theme.colors.opacityDefault.c05} 0%,
          rgba(29, 28, 31, 0) 100%
        );
      }
    `}
          
  }
`;

const Wrapper = styled(Grid)<Pick<NotificationCardProps, "isHighlighted">>`
  background-color: ${p => (p.isHighlighted ? p.theme.colors.opacityDefault.c05 : "transparent")};

  cursor: pointer;
  padding: 12px;
  grid-template-columns: auto 1fr;
  gap: ${p => (p.isHighlighted ? "12px" : "24px")};
  border-radius: 12px;

  align-items: center;
  justify-content: start;
`;
