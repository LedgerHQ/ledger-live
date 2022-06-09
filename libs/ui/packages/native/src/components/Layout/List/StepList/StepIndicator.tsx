import React from "react";
import { CheckAloneMedium } from "@ledgerhq/icons-ui/native";
import styled, { useTheme } from "styled-components/native";

import { Flex } from "../..";

const TopSegment = styled(Flex)<{ status?: string; hidden?: boolean }>`
  /* For seemless continuity between the dashed lines we need a 3px margin,
  but for solid lines we don't want margins. */
  height: ${(p) => (p.status === "inactive" ? 17 : 20)}px;
  margin-top: ${(p) => (p.status === "inactive" ? 3 : 0)}px;

  border: ${(p) => (p.hidden ? 0 : 1)}px ${(p) => (p.status === "inactive" ? "dashed" : "solid")}
    ${(p) => (p.status === "inactive" ? p.theme.colors.neutral.c40 : p.theme.colors.primary.c80)};
`;

const BottomSegment = styled(Flex)<{ status?: string; hidden?: boolean }>`
  flex: 1;
  border: ${(p) => (p.hidden ? 0 : 1)}px ${(p) => (p.status === "completed" ? "solid" : "dashed")}
    ${(p) => (p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40)};
`;

const MiddleIcon = styled(Flex)<{ status?: string }>`
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  background: ${(p) =>
    p.status === "completed"
      ? p.theme.colors.primary.c80
      : p.status === "active"
      ? p.theme.colors.neutral.c40
      : "transparent"};
  border: 2px solid
    ${(p) => (p.status === "inactive" ? p.theme.colors.neutral.c40 : p.theme.colors.primary.c80)};
`;

export type Props = {
  status?: "inactive" | "active" | "completed";
  hideTopSegment?: boolean;
  hideBottomSegment?: boolean;
};

export default function StepIndicator({ status, hideTopSegment, hideBottomSegment }: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center">
      <TopSegment status={status} hidden={hideTopSegment} />
      <MiddleIcon status={status}>
        {status === "completed" && <CheckAloneMedium color={colors.neutral.c40} size={16} />}
      </MiddleIcon>
      <BottomSegment status={status} hidden={hideBottomSegment} />
    </Flex>
  );
}
