import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, FlatList } from "react-native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import * as Animatable from "react-native-animatable";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { CryptoWithAccounts } from "./types";
import { AssetSelectionNavigatorParamsList } from "../../types";
import useSelectNetworkViewModel from "./useSelectNetworkViewModel";
import NetworkBanner from "../../components/NetworkBanner";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import useAnalytics from "../../../../hooks/useAnalytics";

const keyExtractor = (elem: CryptoWithAccounts) => elem.crypto.id;

const AnimatedView = Animatable.View;

export default function SelectNetwork({
  route,
}: StackNavigatorProps<AssetSelectionNavigatorParamsList, ScreenName.SelectNetwork>) {
  const { filterCurrencyIds, context, currency, inline, sourceScreenName } = route.params;
  const { t } = useTranslation();
  const { analyticsMetadata } = useAnalytics(context, sourceScreenName);

  const {
    hideBanner,
    clickLearn,
    sortedCryptoCurrenciesWithAccounts,
    onPressItem,
    displayBanner,
    titleText,
    subtitleText,
    titleTestId,
    subTitleTestId,
    listTestId,
    providersLoadingStatus,
  } = useSelectNetworkViewModel({
    filterCurrencyIds,
    context,
    currency,
    inline,
    analyticsMetadata,
  });

  const renderItem = useCallback(
    ({ item }: { item: CryptoWithAccounts }) => (
      <BigCurrencyRow
        currency={item.crypto}
        onPress={onPressItem}
        subTitle={
          item.accounts.length > 0
            ? t("assetSelection.selectNetwork.detectedAccounts", { count: item.accounts.length })
            : ""
        }
      />
    ),
    [onPressItem, t],
  );

  const pageTrackingEvent = analyticsMetadata.SelectNetwork?.onAccessScreen;

  return (
    <>
      <TrackScreen name={pageTrackingEvent?.eventName} {...pageTrackingEvent?.payload} />
      <Flex px={6} py={2} testID="select-network-view-area">
        <Text variant="h4" fontWeight="semiBold" testID={titleTestId} mb={2}>
          {titleText}
        </Text>
        {subtitleText && (
          <Text
            variant="bodyLineHeight"
            fontWeight="medium"
            color="neutral.c80"
            testID={subTitleTestId}
          >
            {subtitleText}
          </Text>
        )}
      </Flex>
      <Flex ml={16} mr={16} flex={1}>
        {[LoadingStatus.Success, LoadingStatus.Error].includes(providersLoadingStatus) ? (
          <FlatList
            testID={listTestId}
            contentContainerStyle={styles.list}
            data={sortedCryptoCurrenciesWithAccounts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          />
        ) : (
          <Flex flex={1} mt={6}>
            <InfiniteLoader testID="loader" />
          </Flex>
        )}
      </Flex>
      {displayBanner ? (
        <AnimatedView animation="fadeInUp" delay={50} duration={300}>
          <NetworkBanner hideBanner={hideBanner} onPress={clickLearn} />
        </AnimatedView>
      ) : (
        <AnimatedView animation="fadeOutDown" delay={50} duration={300}>
          <NetworkBanner hideBanner={hideBanner} onPress={clickLearn} />
        </AnimatedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
});
