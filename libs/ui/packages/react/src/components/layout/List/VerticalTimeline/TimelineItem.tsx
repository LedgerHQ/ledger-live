import React from "react";

import { Theme } from "src/styles/theme";
import styled, { useTheme } from "styled-components";

import { Item, ItemStatus } from ".";
import { Flex, Box } from "../..";
import { Text } from "../../..";
import Tag from "../../../Tag";

import TimelineIndicator from "./TimelineIndicator";

export type Props = {
  item: Item;
  isFirstItem?: boolean;
  isLastItem?: boolean;
};

const getContainerBackground = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem && status === "completed") {
    return theme.colors.success.c30;
  } else if (status === "completed") {
    return theme.colors.primary.c20;
  } else if (status === "active") {
    return theme.colors.neutral.c20;
  }
  return theme.colors.neutral.c30;
};

const getContainerBorder = (theme: Theme, status: ItemStatus, isLastItem?: boolean) => {
  if (isLastItem && status === "completed") {
    return theme.colors.success.c30;
  } else if (isLastItem && status === "active") {
    return theme.colors.success.c50;
  } else if (status === "completed") {
    return theme.colors.primary.c20;
  } else if (status === "active") {
    return theme.colors.primary.c80;
  }
  return theme.colors.neutral.c30;
};

const Container = styled(Flex)<{ status: ItemStatus; isLastItem?: boolean }>`
  flex: 1;
  border-radius: ${(p) => p.theme.radii[2]}px;
  background: ${(p) => getContainerBackground(p.theme, p.status, p.isLastItem)};
  border: 1px solid ${(p) => getContainerBorder(p.theme, p.status, p.isLastItem)};
  padding: 20px 16px;
`;

const TimelineIndicatorContentHeader = styled(Flex)`
  justify-content: space-between;
`;

export default function TimelineItem({ item, isFirstItem, isLastItem }: Props) {
  const { colors } = useTheme();

  return (
    <Flex flexDirection="row">
      <TimelineIndicator
        status={item.status}
        isFirstItem={isFirstItem}
        isLastItem={isLastItem}
        mr={4}
      />
      <Container status={item.status} isLastItem={isLastItem} mb={4} flexDirection="column">
        <TimelineIndicatorContentHeader>
          <Text
            variant="body"
            color={
              item.status === "inactive"
                ? "neutral.c80"
                : isLastItem
                ? "success.c50"
                : "primary.c90"
            }
          >
            {item.title}
          </Text>
          {item?.estimatedTime && item.status === "active" && (
            <Tag
              size="small"
              type="opacity"
              active
              disabled
              textProps={{ color: colors.neutral.c100 }}
            >{`${item.estimatedTime / 60} min`}</Tag>
          )}
        </TimelineIndicatorContentHeader>
        {item.renderBody && item.status === "active" && (
          <Box position="relative" pt={6}>
            {item.renderBody(item.status === "active")}
          </Box>
        )}
      </Container>
    </Flex>
  );
}
