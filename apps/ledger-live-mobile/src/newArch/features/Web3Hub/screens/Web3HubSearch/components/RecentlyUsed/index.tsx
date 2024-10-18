import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NavigatorName, ScreenName } from "~/const";
import { SearchProps } from "~/newArch/features/Web3Hub/types";
import RecentCard from "./RecentCard";
import useRecentlyUsedViewModel, {
  useRecentlyUsedViewModelExtraData,
} from "./useRecentlyUsedViewModel";

const identityFn = (item: AppManifest) => item.id;

type Props = {
  navigation: SearchProps["navigation"];
};

const renderItem = ({
  item,
  extraData,
}: {
  item: AppManifest;
  extraData?: useRecentlyUsedViewModelExtraData;
}) => {
  return (
    <RecentCard
      onPress={() => extraData?.onPressItem(item)}
      onClosePress={() => extraData?.onCloseItem(item)}
      item={item}
    />
  );
};

export default function RecentlyUsed({ navigation }: Props) {
  const { colors } = useTheme();

  const goToApp = useCallback(
    (manifestId: string) => {
      navigation.push(NavigatorName.Web3Hub, {
        screen: ScreenName.Web3HubApp,
        params: {
          manifestId: manifestId,
        },
      });
    },
    [navigation],
  );

  const { data, extraData, clearAll } = useRecentlyUsedViewModel(goToApp);

  if (!data?.length) return null;

  return (
    <View
      style={{
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: colors.lightGrey,
        paddingBottom: 15,
      }}
    >
      <Flex flexDirection={"row"} px={5} mb={2} mt={6} justifyContent={"space-between"} height={32}>
        <Text variant="h5" color={colors.black}>
          {"Recently used"}
        </Text>
        <TouchableOpacity onPress={clearAll}>
          <Text fontWeight="semiBold" variant="body" color={"primary.c80"}>
            {"Clear all"}
          </Text>
        </TouchableOpacity>
      </Flex>

      <FlashList
        testID="web3hub-recently-used"
        horizontal
        contentContainerStyle={styles.container}
        keyExtractor={identityFn}
        renderItem={renderItem}
        ListEmptyComponent={<Box height={50} />}
        estimatedItemSize={50}
        data={data}
        showsHorizontalScrollIndicator={false}
        extraData={extraData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
  },
});
