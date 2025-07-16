import React, { type ReactEventHandler, type ReactNode } from "react";
import styled from "styled-components";

import * as Icons from "@ledgerhq/icons-ui/react";
import { NotificationIcon } from "../../../asorted";
import Text from "../../../asorted/Text";
import type { Props as GridBoxProps } from "../../Grid";
import { Grid, Flex } from "../..";

type IconKey = keyof typeof Icons;

type Props = GridBoxProps & {
  title?: string;
  cta?: ReactNode;
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
}: Props) {
  const handleCTAClick: ReactEventHandler = event => {
    event.stopPropagation();
    onClick(event);
  };

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
        {cta}
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

const Wrapper = styled(Grid)<Pick<Props, "isHighlighted">>`
  background-color: ${({ isHighlighted, theme: { colors } }) => {
    if (!isHighlighted) return "transparent";
    return colors.type === "dark" ? colors.opacityDefault.c05 : colors.neutral.c00;
  }};

  cursor: pointer;
  padding: 12px;
  grid-template-columns: auto 1fr;
  gap: ${p => (p.isHighlighted ? "12px" : "24px")};
  border-radius: 12px;

  align-items: center;
  justify-content: start;
`;
