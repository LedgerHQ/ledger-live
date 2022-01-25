import React, { useCallback } from "react";
import Text from "../../../Text";
import { Box, Flex } from "../../index";
import { BaseStyledProps } from "../../../styled";
import { FlatList } from "react-native";

export type BaseListItemProps = {
  title?: string;
  description?: string;
  bullet?: React.ReactNode;
};

export type BaseListProps = {
  items: BaseListItemProps[];
  itemContainerProps?: BaseStyledProps;
};

export const ListItem = ({
  title,
  description,
  bullet = null,
  ...props
}: BaseStyledProps & BaseListItemProps): React.ReactElement => {
  return (
    <Flex flexDirection={"row"} alignItems={"center"} {...props}>
      {bullet && (
        <Box mr={7} flexShrink={0}>
          {bullet}
        </Box>
      )}
      <Flex flexDirection={"column"} flexShrink={1} flexWrap={"nowrap"}>
        {title && (
          <Text
            variant={"body"}
            fontWeight={"semiBold"}
            color={"neutral.c100"}
            flexShrink={1}
            mb={description ? 2 : null}
          >
            {title}
          </Text>
        )}
        {description && (
          <Text variant={"body"} fontWeight={"medium"} color={"neutral.c80"} flexShrink={1}>
            {description}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default function List({
  items,
  itemContainerProps,
  ...props
}: BaseListProps): React.ReactElement {
  const renderItem = useCallback(
    ({ item }: { item: BaseListItemProps }) => (
      <ListItem {...item} mb={6} pb={2} {...itemContainerProps} />
    ),
    [itemContainerProps],
  );

  return (
    <Flex flexDirection={"column"} {...props}>
      <FlatList data={items} renderItem={renderItem} />
    </Flex>
  );
}
