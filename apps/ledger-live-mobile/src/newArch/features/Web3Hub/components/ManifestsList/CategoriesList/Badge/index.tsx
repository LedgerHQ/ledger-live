import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";

export default function Badge({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        bg={selected ? "primary.c80" : "neutral.c30"}
        flexDirection={"row"}
        marginLeft={selected ? 0 : "6px"}
        marginRight={"6px"}
        px={4}
        py={1}
        justifyContent={"center"}
        alignItems={"center"}
        height={32}
        borderRadius={32}
      >
        <Text
          textTransform="capitalize"
          fontWeight="semiBold"
          variant="body"
          color={selected ? "neutral.c30" : "primary.c80"}
        >
          {label}
        </Text>
      </Flex>
    </TouchableOpacity>
  );
}
