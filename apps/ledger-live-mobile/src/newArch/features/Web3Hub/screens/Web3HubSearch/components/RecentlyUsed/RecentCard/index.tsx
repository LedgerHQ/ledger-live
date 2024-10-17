import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";

export default function RecentCard({
  item,
  onPress,
  onClosePress,
}: {
  item: AppManifest;
  onPress: () => void;
  onClosePress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} testID={`${item.id}-recently-used`}>
      <Flex
        bg={colors.lightGrey}
        flexDirection={"row"}
        mx={"6px"}
        px={4}
        py={1}
        justifyContent={"center"}
        alignItems={"center"}
        height={45}
        borderRadius={16}
        columnGap={10}
      >
        {item.icon ? (
          <Image
            style={{ height: 20, width: 20, borderRadius: 4 }}
            source={{
              uri: item.icon!,
            }}
          />
        ) : (
          <View style={{ height: 20, width: 20, borderRadius: 4, backgroundColor: colors.black }} />
        )}
        <Text fontWeight="semiBold" variant="body" color={colors.black}>
          {item.name}
        </Text>
        <TouchableOpacity onPress={onClosePress}>
          <IconsLegacy.CloseMedium size={18} color={colors.grey} />
        </TouchableOpacity>
      </Flex>
    </TouchableOpacity>
  );
}
