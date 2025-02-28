import React, { type ReactEventHandler, type ReactNode } from "react";
import styled from "styled-components";

import * as Icons from "@ledgerhq/icons-ui/react";
import { NotificationIcon, Text } from "../../../asorted";
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

  const ctaColor = isHighlighted ? "primary.c80" : "neutral.c100";

  return (
    <Wrapper {...boxProps} isHighlighted={isHighlighted} onClick={handleCTAClick}>
      <NotificationIcon icon={icon} variant={isHighlighted ? "square" : "round"} />
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
