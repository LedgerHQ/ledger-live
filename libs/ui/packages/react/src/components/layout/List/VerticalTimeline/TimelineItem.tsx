import React from "react";

import { Theme } from "../../../../styles/theme";
import styled, { useTheme } from "styled-components";

import { Item, ItemStatus } from ".";
import { Flex, Box } from "../..";
import { Text } from "../../..";
import Tag from "../../../Tag";
import InfiniteLoader from "../../../loaders/InfiniteLoader";

import TimelineIndicator from "./TimelineIndicator";

export type Props = {
  item: Item;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  onClick?: () => void;
  activeBackground?: string;
  isNeutral?: boolean;
};

const getContainerBackground = (theme: Theme, status: ItemStatus, activeBackground?: string) => {
  if (status === "completed") {
    return "transparent";
  } else if (status === "active") {
    return activeBackground || theme.colors.neutral.c20;
  }
  return "transparent";
};

const getContainerBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (status === "completed") {
    return "transparent";
  } else if (isLastItem && status === "active") {
    return theme.colors.success.c50;
  } else if (status === "active") {
    return theme.colors.neutral.c40;
  }
  return "transparent";
};

const Container = styled(Flex)<{
  status: ItemStatus;
  isLastItem?: boolean;
  activeBackground?: string;
}>`
  position: relative;
  flex: 1;
  border-radius: ${p => p.theme.radii[2]}px;
  background: ${p => getContainerBackground(p.theme, p.status, p.activeBackground)};
  border: 1px solid ${p => getContainerBorder(p.theme, p.status, p.isLastItem)};
`;

const TextContainer = styled(Flex)`
  flex: 1;
  padding: 20px 16px;
`;

const TimelineIndicatorContentHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`;

function TimelineItem({ item, isFirstItem, isLastItem, onClick, isNeutral }: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="row" onClick={onClick} flex={1}>
      <TimelineIndicator
        status={item.status}
        isFirstItem={isFirstItem}
        isLastItem={isLastItem}
        mr={4}
        isNeutral={isNeutral}
      />
      <Container
        status={item.status}
        isLastItem={isLastItem && !isNeutral}
        overflow="hidden"
        activeBackground={item.activeBackground}
      >
        {item.status === "active" ? item.background : null}

        <TextContainer mb={4} flexDirection="column" zIndex={1}>
          <TimelineIndicatorContentHeader height="20px">
            <Text
              variant="body"
              fontWeight={item.status === "active" ? "semiBold" : "medium"}
              color={
                item.status !== "inactive" && isLastItem && !isNeutral
                  ? "success.c70"
                  : item.status === "active"
                    ? "primary.c80"
                    : "neutral.c70"
              }
            >
              {item.title}
            </Text>
            {(item?.estimatedTime && item.status === "active" && (
              <Tag
                size="small"
                type="opacity"
                active
                disabled
                textProps={{ color: colors.neutral.c100 }}
              >{`${item.estimatedTime / 60} min`}</Tag>
            )) ||
              (item?.hasLoader && item.status === "active" && <InfiniteLoader size={30} />)}
          </TimelineIndicatorContentHeader>
          {item.renderBody && item.status === "active" && (
            <Box position="relative" pt={6}>
              {item.renderBody(item.status === "active")}
            </Box>
          )}
        </TextContainer>
      </Container>
    </Flex>
  );
}

export default React.memo(TimelineItem);
