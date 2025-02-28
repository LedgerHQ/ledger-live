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

type WrapperType = "round" | "square";
type IconPallet = { fg: string; bg: string };
const colorsByIcon: Partial<Record<IconKey, Partial<Record<WrapperType, Partial<IconPallet>>>>> = {
  Warning: {
    round: {
      fg: "warning.c80",
      bg: "warning.c30",
    },
    square: {
      fg: "warning.c80",
      bg: "warning.c30",
    },
  },
};

const defaultDefaultColors: Record<WrapperType, IconPallet> = {
  round: {
    fg: "primary.c90",
    bg: "primary.c30",
  },
  square: {
    fg: "primary.c80",
    bg: "primary.c10",
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
  const iconType = isHighlighted ? "square" : "round";
  const colors = colorsByIcon[safeIcon]?.[iconType];
  const iconColor = colors?.fg ?? defaultDefaultColors[iconType].fg;
  const iconBgColor = colors?.bg ?? defaultDefaultColors[iconType].bg;

  const ctaColor = isHighlighted ? "primary.c80" : "neutral.c100";

  return (
    <Wrapper {...boxProps} isHighlighted={isHighlighted} onClick={handleCTAClick}>
      <IconWrapper backgroundColor={iconBgColor} type={iconType}>
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

const IconWrapper = styled(Flex)<{ type?: WrapperType }>`
  padding: 8px;
  ${p => (p.type === "square" ? squareWrapper : roundWrapper)}
`;

const roundWrapper = css`
  border-radius: 50%;
`;

const squareWrapper = css`
  border-radius: 13.5px;
  background-clip: padding-box;
  border-width: 7px;
  border-style: solid;
  border-color: transparent;
  position: relative;
  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: -7px;
    border-radius: 13.5px;
  }
  &::before {
    background: ${p => css`linear-gradient(
        ${p.theme.colors.opacityDefault.c10} 0%,
        rgba(29, 28, 31, 0) 100%
      );
  `};
  }
  &::after {
    border: solid 0.5px #fff;
    mask-image: linear-gradient(
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.01) 60%,
      rgba(255, 255, 255, 0) 100%
    );
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
