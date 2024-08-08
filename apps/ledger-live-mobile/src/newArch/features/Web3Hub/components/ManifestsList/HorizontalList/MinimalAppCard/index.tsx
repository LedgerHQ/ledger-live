import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";


export default function MinimalAppCard({
    item,
    onPress
}: {
    item: AppManifest
    onPress: () => void;
}) {
  return (
    <TouchableOpacity disabled={item.branch==="soon"} onPress={onPress}>
        <Flex rowGap={6} marginRight={3}  width={70}  alignItems={"center"}>
        <AppIcon isDisabled={item.branch==="soon"} size={48} name={item.name} icon={item.icon} />
        <Text numberOfLines={1}>{item.name}</Text>
    </Flex>
    </TouchableOpacity>
  );
}