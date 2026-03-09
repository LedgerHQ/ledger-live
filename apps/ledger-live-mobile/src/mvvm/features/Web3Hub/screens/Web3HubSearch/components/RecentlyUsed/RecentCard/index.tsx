import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { TouchableOpacity } from "react-native";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";

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
        <AppIcon size={20} name={item.name} icon={item.icon?.trim()} />
        <Text fontWeight="semiBold" variant="body" color={colors.black}>
          {item.name}
        </Text>
        <TouchableOpacity onPress={onClosePress} testID={`${item.id}-recently-used-remove`}>
          <IconsLegacy.CloseMedium size={18} color={colors.grey} />
        </TouchableOpacity>
      </Flex>
    </TouchableOpacity>
  );
}
