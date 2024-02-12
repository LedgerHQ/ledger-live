import React from "react";
import CircledCheckSolidMedium from "@ledgerhq/icons-ui/reactLegacy/CircledCheckSolidMedium";
import styled, { useTheme } from "styled-components";

import Flex, { FlexBoxProps as FlexProps } from "../../Flex";
import { ItemStatus } from "./index";
import { Theme } from "../../../../styles/theme";

const linesWidth = 2;

const BottomSegment = styled(Flex)<{ status: ItemStatus; hidden?: boolean }>`
  flex: 1;
  border-left-width: ${p => (p.hidden ? 0 : linesWidth)}px;
  border-right-width: 0;
  border-style: dashed;
  border-color: ${p =>
    p.status === "completed" ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40};
  background: ${p => p.status === "completed" && p.theme.colors.primary.c80};
`;

const getIconBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem) {
    if (status === "inactive") return theme.colors.success.c10;
    return "transparent";
  } else if (status === "active") {
    return theme.colors.neutral.c40;
  } else {
    return "transparent";
  }
};

const getIconBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem) {
    return theme.colors.success.c70;
  } else if (status === "inactive") {
    return theme.colors.neutral.c40;
  }
  return theme.colors.primary.c80;
};

const CenterCircle = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  border-radius: 9999px;
  width: 100%;
  background: ${p => getIconBackground(p.theme, p.status, p.isLastItem)};
  border: 2px solid ${p => getIconBorder(p.theme, p.status, p.isLastItem)};
  align-items: center;
  justify-content: center;
  position: relative;
`;

const IconWrapper = styled(Flex)`
  height: 16px;
  width: 16px;
`;

export type Props = FlexProps & {
  status: "inactive" | "active" | "completed";
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const topSegmentDefaultHeight = 23;

const Container = styled(Flex)`
  flex-direction: column;
  align-items: center;
  margin-bottom: ${-topSegmentDefaultHeight}px;
  padding-top: ${topSegmentDefaultHeight}px;
`;

function TimelineIndicator({ status, isLastItem, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <Container {...props}>
      <IconWrapper>
        <CenterCircle status={status} isLastItem={isLastItem}>
          {status === "completed" && (
            <Flex position="absolute">
              <CircledCheckSolidMedium
                color={isLastItem ? colors.success.c70 : colors.primary.c80}
                size={20}
              />
            </Flex>
          )}
        </CenterCircle>
      </IconWrapper>
      {isLastItem ? null : <BottomSegment status={status} />}
    </Container>
  );
}

export default React.memo(TimelineIndicator);

TimelineIndicator.topSegmentDefaultHeight = topSegmentDefaultHeight;
