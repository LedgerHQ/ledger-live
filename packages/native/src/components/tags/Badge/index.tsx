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
      color: "palette.neutral.c80",
      borderWidth: 1,
      borderColor: "palette.neutral.c40",
    },
    active: {
      color: "palette.neutral.c00",
      backgroundColor: "palette.neutral.c100",
    },
  },
  primary: {
    default: {
      color: "palette.primary.c90",
    },
    active: {
      color: "palette.primary.c90",
      backgroundColor: "palette.primary.c20",
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
