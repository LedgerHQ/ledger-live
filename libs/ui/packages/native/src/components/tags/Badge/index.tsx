import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";

type BadgeType = "main" | "primary";

export interface BadgeProps {
  badgeVariant?: BadgeType;
  active?: boolean;
  children: React.ReactNode;
}

const badgesStyle: {
  [index: string]: {
    [index: string]: {
      color: string;
      borderWidth?: number;
      borderColor?: string;
      backgroundColor?: string;
    };
  };
} = {
  main: {
    default: {
      color: "neutral.c80",
      borderWidth: 1,
      borderColor: "neutral.c40",
    },
    active: {
      color: "neutral.c00",
      backgroundColor: "neutral.c100",
    },
  },
  primary: {
    default: {
      color: "primary.c90",
    },
    active: {
      color: "primary.c90",
      backgroundColor: "primary.c20",
    },
  },
};

const StyledBadgeText = styled(Text).attrs<BadgeProps>((p) => ({
  ...badgesStyle[p.badgeVariant || "main"][p.active ? "active" : "default"],
}))<BadgeProps>`
  border-radius: 32px;
  padding: 8px;
`;

export default function Badge({
  badgeVariant = "main",
  active = false,
  children,
}: BadgeProps): JSX.Element {
  return (
    <StyledBadgeText
      badgeVariant={badgeVariant}
      active={active}
      variant={"subtitle"}
      fontWeight={"semiBold"}
    >
      {children}
    </StyledBadgeText>
  );
}
