import React from "react";
import styled from "styled-components/native";
import Text from "../../../Text";
import { Box, Flex } from "../../index";
import baseStyled, { BaseStyledProps } from "../../../styled";
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

const ListContainer = styled.View`
  display: flex;
  flex-direction: column;
`;

const ListItemContainer = baseStyled.View`
  display: flex;
  flex-direction: row;
`;

export const ListItem = ({
  title,
  description,
  bullet = null,
  ...props
}: BaseStyledProps & BaseListItemProps): React.ReactElement => {
  return (
    <ListItemContainer {...props}>
      {bullet && <Box mr={7}>{bullet}</Box>}
      <Flex flexDirection={"column"}>
        {title && (
          <Text variant={"body"} fontWeight={"semiBold"} color={"neutral.c100"}>
            {title}
          </Text>
        )}
        {description && (
          <Text variant={"body"} fontWeight={"medium"} color={"neutral.c80"}>
            {description}
          </Text>
        )}
      </Flex>
    </ListItemContainer>
  );
};

export default function List({
  items,
  itemContainerProps,
  ...props
}: BaseListProps): React.ReactElement {
  return (
    <ListContainer {...props}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ListItem {...item} mb={6} pb={2} {...itemContainerProps} />
        )}
      />
    </ListContainer>
  );
}
