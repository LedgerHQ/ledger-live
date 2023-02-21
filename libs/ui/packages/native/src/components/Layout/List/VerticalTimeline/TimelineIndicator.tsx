import React from "react";
import { CircledCheckSolidMedium } from "@ledgerhq/icons-ui/native";
import styled, { useTheme } from "styled-components/native";

import Flex, { Props as FlexProps } from "../../Flex";
import { ItemStatus } from "../types";
import { Theme } from "src/styles/theme";

const TopSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  height: 20px;
  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: solid;
  border-color: ${(p) =>
    p.status === "inactive" ? p.theme.colors.neutral.c50 : p.theme.colors.primary.c80};
  background: ${(p) =>
    p.status === "inactive" ? p.theme.colors.neutral.c50 : p.theme.colors.primary.c80};
`;

const BottomSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  flex: 1;
  border-width: ${(p) => (p.hidden ? 0 : 1)}px;
  border-style: solid;
  border-color: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c50};
  background: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c50};
`;

const getIconBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (status === "completed") {
    return "transparent";
  } else if (isLastItem) {
    return theme.colors.success.c10;
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

const CenterSegment = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  border-radius: 9999px;
  width: 20px;
  height: 20px;
  background: ${(p) => getIconBackground(p.theme, p.status, p.isLastItem)};
  border: 2px solid ${(p) => getIconBorder(p.theme, p.status, p.isLastItem)};
  align-items: center;
  justify-content: center;
`;

export type Props = FlexProps & {
  status: ItemStatus;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

export default function TimelineIndicator({ status, isFirstItem, isLastItem, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" {...props}>
      <TopSegment status={status} hidden={isFirstItem} />
      <CenterSegment status={status} isLastItem={isLastItem}>
        {status === "completed" && (
          <CircledCheckSolidMedium
            color={isLastItem ? colors.success.c100 : colors.primary.c80}
            size={24}
          />
        )}
      </CenterSegment>
      <BottomSegment status={status} hidden={isLastItem} />
    </Flex>
  );
}
