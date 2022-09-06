import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";

type Props = {
  name: string;
  Icon?: IconType;
  onPress?: () => void;
  RightComponent?: React.ReactNode;
};

export default function AccountSectionLabel({
  name,
  Icon,
  onPress,
  RightComponent,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <Flex flexDirection={"row"} alignItems={"center"} flex={1}>
        <Text
          variant="small"
          fontWeight="semiBold"
          color="neutral.c70"
          uppercase
        >
          {name}
        </Text>
        {Icon && (
          <Box ml={2}>
            <Icon size={16} color={"neutral.c70"} />
          </Box>
        )}
      </Flex>
      {!!RightComponent && (
        <View style={styles.rightWrapper}>{RightComponent}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightWrapper: {
    alignSelf: "flex-end",
  },
});
