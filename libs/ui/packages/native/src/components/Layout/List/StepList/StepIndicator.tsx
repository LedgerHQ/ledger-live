import React from "react";
import { CheckAloneMedium } from "@ledgerhq/icons-ui/native";
import styled, { useTheme } from "styled-components/native";

import Flex, { Props as FlexProps } from "../../Flex";
import { ItemStatus } from ".";

const TopSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  /* For seemless continuity between the dashed lines we need a 3px margin,
  but for solid lines we don't want margins. */
  height: ${(p) => (p.status === "inactive" ? 17 : 20)}px;
  margin-top: ${(p) => (p.status === "inactive" ? 3 : 0)}px;

  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: ${(p) => (p.status === "inactive" ? "dashed" : "solid")};
  border-color: ${(p) =>
    p.status === "inactive" ? p.theme.colors.neutral.c40 : p.theme.colors.primary.c80};
`;

const BottomSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  flex: 1;
  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: ${(p) => (p.status === "completed" ? "solid" : "dashed")};
  border-color: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40};
`;

const MiddleIcon = styled(Flex)<{ status: ItemStatus }>`
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

export type Props = FlexProps & {
  status: "inactive" | "active" | "completed";
  hideTopSegment?: boolean;
  hideBottomSegment?: boolean;
};

export default function StepIndicator({
  status,
  hideTopSegment,
  hideBottomSegment,
  ...props
}: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" {...props}>
      <TopSegment status={status} hidden={hideTopSegment} />
      <MiddleIcon status={status}>
        {status === "completed" && <CheckAloneMedium color={colors.neutral.c40} size={16} />}
      </MiddleIcon>
      <BottomSegment status={status} hidden={hideBottomSegment} />
    </Flex>
  );
}
