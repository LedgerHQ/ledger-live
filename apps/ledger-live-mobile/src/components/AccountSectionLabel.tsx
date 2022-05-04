import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

type Props = {
  name: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  RightComponent?: React.ReactNode;
};

export default function AccountSectionLabel({
  name,
  icon,
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
        <Text variant={"h3"} color={"neutral.c100"}>
          {name}
        </Text>
        <Box ml={3} mb={2}>
          {icon}
        </Box>
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
    paddingVertical: 12,
  },
  rightWrapper: {
    alignSelf: "flex-end",
  },
});
