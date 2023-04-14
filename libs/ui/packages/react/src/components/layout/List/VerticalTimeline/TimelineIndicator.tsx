import React from "react";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/react/CircledCheckSolidMedium";
import styled, { useTheme } from "styled-components";

import Flex, { FlexBoxProps as FlexProps } from "../../Flex";
import { ItemStatus } from "./index";
import { Theme } from "src/styles/theme";

const linesWidth = 2;

const TopSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  border-left-width: ${(p) => (p.hidden ? 0 : linesWidth)}px;
  border-right-width: 0;
  border-style: dashed;
  border-color: ${(p) =>
    p.status === "inactive" ? p.theme.colors.neutral.c50 : p.theme.colors.primary.c80};
  background: ${(p) => p.status !== "inactive" && p.theme.colors.primary.c80};
`;

const BottomSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  flex: 1;
  border-left-width: ${(p) => (p.hidden ? 0 : linesWidth)}px;
  border-right-width: 0;
  border-style: dashed;
  border-color: ${(p) =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c50};
  background: ${(p) => p.status === "completed" && p.theme.colors.primary.c80};
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
    return theme.colors.success.c50;
  } else if (status === "inactive") {
    return theme.colors.neutral.c50;
  }
  return theme.colors.primary.c80;
};

const CenterCircle = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  border-radius: 9999px;
  width: 12px;
  height: 12px;
  background: ${(p) => getIconBackground(p.theme, p.status, p.isLastItem)};
  border: 2px solid ${(p) => getIconBorder(p.theme, p.status, p.isLastItem)};
  align-items: center;
  justify-content: center;
`;

const IconWrapper = styled(Flex)`
  flex: none;
`;

export type Props = FlexProps & {
  status: "inactive" | "active" | "completed";
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const topSegmentDefaultHeight = 20;

function TimelineIndicator({ status, isFirstItem, isLastItem, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      {...props}
      marginBottom={status === "completed" || isLastItem ? 0 : -topSegmentDefaultHeight / 2}
    >
      {status === "active" || status === "completed" ? (
        <TopSegment height={topSegmentDefaultHeight} status={status} hidden={isFirstItem} />
      ) : (
        <Flex height={topSegmentDefaultHeight} />
      )}
      <CenterCircle status={status} isLastItem={isLastItem}>
        {status === "completed" && (
          <IconWrapper>
            <CircledCheckSolidMedium
              color={isLastItem ? colors.success.c50 : colors.primary.c80}
              size={20}
            />
          </IconWrapper>
        )}
      </CenterCircle>
      {isLastItem ? null : <BottomSegment status={status} />}
    </Flex>
  );
}

export default React.memo(TimelineIndicator);

TimelineIndicator.topSegmentDefaultHeight = topSegmentDefaultHeight;
