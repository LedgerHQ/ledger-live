import React, { useCallback } from "react";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { Box, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import LoadingIndicator from "LLM/features/Web3Hub/components/ManifestsList/LoadingIndicator";
import Disclaimer, { useDisclaimerViewModel } from "LLM/features/Web3Hub/components/Disclaimer";
import type { SearchProps } from "LLM/features/Web3Hub/types";
import { ScreenName } from "~/const";
import useSearchListViewModel from "./useSearchListViewModel";
import SearchItem from "./SearchItem";

type NavigationProp = SearchProps["navigation"];

type Props = {
  navigation: NavigationProp;
  search: string;
  onScroll?: FlashListProps<AppManifest>["onScroll"];
  pt?: number;
};

const AnimatedFlashList = Animated.createAnimatedComponent<FlashListProps<AppManifest>>(FlashList);

const keyExtractor = (item: AppManifest) => item.id;

const noop = () => {};

const renderItem = ({
  item,
  extraData = noop,
}: {
  item: AppManifest;
  extraData?: (manifest: AppManifest) => void;
}) => {
  return <SearchItem manifest={item} onPress={extraData} />;
};

export default function SearchList({ navigation, search, onScroll, pt = 0 }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, onEndReached } = useSearchListViewModel(search);

  const goToApp = useCallback(
    (manifestId: string) => {
      navigation.push(ScreenName.Web3HubApp, {
        manifestId: manifestId,
      });
    },
    [navigation],
  );

  const disclaimer = useDisclaimerViewModel(goToApp);

  return (
    <>
      <Disclaimer disclaimer={disclaimer} />
      <AnimatedFlashList
        contentContainerStyle={{
          paddingTop: pt,
        }}
        testID="web3hub-manifests-search-scroll"
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
        ListEmptyComponent={
          isLoading ? null : ( // TODO handle empty case
            <Box height={40}>
              <Text>{t("common.retry")}</Text>
            </Box>
          )
        }
        estimatedItemSize={128}
        data={data}
        extraData={disclaimer.onPressItem}
        onEndReached={onEndReached}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    </>
  );
}
