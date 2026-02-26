import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";
import { SearchProps } from "LLM/features/Web3Hub/types";
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
  const { data, extraData, clearAll } = useRecentlyUsedViewModel(navigation);
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!data?.length) return null;

  return (
    <>
      <Flex flexDirection={"row"} px={5} mb={2} mt={6} justifyContent={"space-between"} height={32}>
        <Text variant="h5" color={colors.black}>
          {t("browseWeb3.catalog.section.recentlyUsed")}
        </Text>
        <TouchableOpacity onPress={clearAll}>
          <Text fontWeight="semiBold" variant="body" color={"primary.c80"}>
            {t("browseWeb3.catalog.section.clearAll")}
          </Text>
        </TouchableOpacity>
      </Flex>

      <FlashList
        testID="web3hub-recently-used"
        horizontal
        contentContainerStyle={styles.container}
        keyExtractor={identityFn}
        renderItem={renderItem}
        data={data}
        showsHorizontalScrollIndicator={false}
        extraData={extraData}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
  },
});
