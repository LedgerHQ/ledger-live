import React from "react";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import { StyledCheckIconContainer } from "./RowItem.styled";

export type Item = {
  value: string;
  label: string;
};
interface RowItemProps {
  item: Item;
  index: number;
  onSelectCurrency: (value: string) => void;
  counterCurrency?: string;
}
function RowItem({ item, index, counterCurrency, onSelectCurrency }: RowItemProps) {
  const isChecked = counterCurrency === item.value;
  const color = isChecked ? "primary.c80" : "neutral.c100";
  const labelColor = isChecked ? "primary.c80" : "neutral.c80";
  return (
    <TouchableOpacity key={index} onPress={() => onSelectCurrency(item.value)}>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        height="48px"
        my={2}
        px={4}
      >
        <Flex flexDirection="row" alignItems="center">
          <Text variant="body" fontWeight="bold" mr={3} color={color}>
            {item.value.toUpperCase()}
          </Text>
          <Text variant="small" fontWeight="semiBold" color={labelColor}>
            {item.label}
          </Text>
        </Flex>
        {counterCurrency === item.value ? (
          <StyledCheckIconContainer>
            <Icon name="CheckAlone" size={12} color="background.main" />
          </StyledCheckIconContainer>
        ) : null}
      </Flex>
    </TouchableOpacity>
  );
}

export default RowItem;
