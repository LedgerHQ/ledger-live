import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, FlatList } from "react-native";
import { BannerCard, Flex, Text } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ChartNetworkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import BigCurrencyRow from "~/components/BigCurrencyRow";
import { CryptoWithAccounts } from "./types";
import { AssetSelectionNavigatorParamsList } from "../../types";
import useSelectNetworkViewModel from "./useSelectNetworkViewModel";

const keyExtractor = (elem: CryptoWithAccounts) => elem.crypto.id;

const AnimatedView = Animatable.View;

export default function SelectNetwork({
  route,
}: StackNavigatorProps<AssetSelectionNavigatorParamsList, ScreenName.SelectNetwork>) {
  const { provider, filterCurrencyIds, context } = route.params;
  const { t } = useTranslation();
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
  } = useSelectNetworkViewModel({ provider, filterCurrencyIds, context });

  const renderItem = useCallback(
    ({ item }: { item: CryptoWithAccounts }) => (
      <BigCurrencyRow
        currency={item.crypto}
        onPress={onPressItem}
        subTitle={
          item.accounts.length > 0
            ? t("transfer.receive.selectNetwork.account", { count: item.accounts.length })
            : ""
        }
      />
    ),
    [onPressItem, t],
  );

  return (
    <>
      <TrackScreen category="Deposit" name="Choose a network" />
      <Flex px={6} py={2}>
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
        <FlatList
          testID={listTestId}
          contentContainerStyle={styles.list}
          data={sortedCryptoCurrenciesWithAccounts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
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

type BannerProps = {
  hideBanner: () => void;
  onPress: () => void;
};

const NetworkBanner = ({ onPress, hideBanner }: BannerProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Flex pb={insets.bottom + 2} px={6} mb={6}>
      <BannerCard
        typeOfRightIcon="close"
        title={t("transfer.receive.selectNetwork.bannerTitle")}
        LeftElement={<ChartNetworkMedium />}
        onPressDismiss={hideBanner}
        onPress={onPress}
      />
    </Flex>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
});
