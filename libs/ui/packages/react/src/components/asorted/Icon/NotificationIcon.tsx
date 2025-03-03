import React from "react";
import styled, { css } from "styled-components";

import * as Icons from "@ledgerhq/icons-ui/react";
import { Box } from "../../layout";

type IconKey = keyof typeof Icons;
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

type Props = {
  icon: IconKey;
  variant: WrapperType;
};

export default function NotificationIcon({ icon, variant = "round" }: Props) {
  const safeIcon: IconKey = icon in Icons ? icon : "Information";
  const Icon = Icons[safeIcon];
  const colors = colorsByIcon[safeIcon]?.[variant];
  const iconColor = colors?.fg ?? defaultDefaultColors[variant].fg;
  const iconBgColor = colors?.bg ?? defaultDefaultColors[variant].bg;

  return (
    <Wrapper backgroundColor={iconBgColor} variant={variant}>
      <Icon color={iconColor} />
    </Wrapper>
  );
}

const Wrapper = styled(Box)<{ variant: WrapperType }>`
  display: inline-flex;
  padding: 8px;
  ${p => (p.variant === "square" ? squareWrapper : roundWrapper)}
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

  ${p => css`
    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: -7px;
      border-radius: 13.5px;
      rotate: ${p.theme.colors.type === "dark" ? "0deg" : "180deg"};
    }
    &::before {
      background: linear-gradient(
        ${p.theme.colors.type === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(29, 28, 31, 0.05)"}
          0%,
        rgba(29, 28, 31, 0) 100%
      );
    }
    &::after {
      content: ${p.theme.colors.type};
      border: solid 0.5px ${p.theme.colors.type === "dark" ? "#fff" : "rgba(0, 0, 0, 0.5)"};
      mask-image: linear-gradient(
        rgba(255, 255, 255, 0.15) 0%,
        rgba(255, 255, 255, 0.01) 60%,
        rgba(255, 255, 255, 0) 100%
      );
    }
  `};
`;
