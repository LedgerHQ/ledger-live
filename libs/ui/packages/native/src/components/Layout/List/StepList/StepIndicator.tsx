import React from "react";
import { CheckAloneMedium } from "@ledgerhq/icons-ui/native";
import styled, { useTheme } from "styled-components/native";

import Flex, { Props as FlexProps } from "../../Flex";
import { ItemStatus } from ".";
import { Theme } from "src/styles/theme";

const TopSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  height: 20px;
  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: solid;
  border-color: ${(p) =>
    p.status === "inactive" ? p.theme.colors.neutral.c50 : p.theme.colors.primary.c80};
`;

const BottomSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  flex: 1;
  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: solid;
  border-color: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c50};
`;

const getIconBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem && status === "completed") {
    return theme.colors.success.c100;
  } else if (isLastItem) {
    return theme.colors.success.c10;
  } else if (status === "completed") {
    return theme.colors.primary.c80;
  } else if (status === "active") {
    return theme.colors.neutral.c40;
  }
  return theme.colors.background.main;
};

const getIconBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem) {
    return theme.colors.success.c100;
  } else if (status === "inactive") {
    return theme.colors.neutral.c50;
  }
  return theme.colors.primary.c80;
};

const MiddleIcon = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  background: ${(p) => getIconBackground(p.theme, p.status, p.isLastItem)};
  border: 2px solid ${(p) => getIconBorder(p.theme, p.status, p.isLastItem)};
`;

export type Props = FlexProps & {
  status: "inactive" | "active" | "completed";
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

export default function StepIndicator({ status, isFirstItem, isLastItem, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" {...props}>
      <TopSegment status={status} hidden={isFirstItem} />
      <MiddleIcon status={status} isLastItem={isLastItem}>
        {status === "completed" && <CheckAloneMedium color={colors.neutral.c40} size={16} />}
      </MiddleIcon>
      <BottomSegment status={status} hidden={isLastItem} />
    </Flex>
  );
}
