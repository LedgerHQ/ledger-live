import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import { TrackScreen } from "~/analytics";
import NftFilterSection from "./NftFilterSection";
import { NftFilterCurrencyItem } from "./NftFilterItem";
import { NftGalleryChainFiltersState } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { useNavigation } from "@react-navigation/native";
import { track } from "~/analytics";
import { View } from "react-native";
import QueuedDrawer from "../../../QueuedDrawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  toggleFilter: (filter: keyof NftGalleryChainFiltersState) => void;
  filters: NftGalleryChainFiltersState;
};
const NftFilterDraw: FC<Props> = ({ onClose, isOpen, filters, toggleFilter }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={() => {
        track("button_clicked", {
          button: "Close Filter",
          page: ScreenName.WalletNftGallery,
          drawer: "Filter selection",
        });
        onClose();
      }}
    >
      <TrackScreen category="NFT Gallery Filters" type="drawer" refreshSource={false} />
      <View testID="wallet-nft-gallery-filter-drawer">
        <NftFilterSection title={t("wallet.nftGallery.filters.blockchain")}>
          {Object.entries(filters).map(([key, value]) => {
            // NOTE: We have to assert the type here because Object.assign assumes
            // keys are strings, when in fact it is actually a CryptoCurrencyId.
            const currencyId = key as keyof NftGalleryChainFiltersState;
            return (
              <NftFilterCurrencyItem
                key={key}
                currency={currencyId}
                isSelected={value}
                onPress={() => {
                  track("button_clicked", {
                    button: "Toggle Network Filter",
                    page: ScreenName.WalletNftGallery,
                    network: currencyId,
                  });
                  toggleFilter(currencyId);
                }}
              />
            );
          })}
        </NftFilterSection>
        <NftFilterSection
          title={t("wallet.nftGallery.filters.hiddenCollections")}
          onSeeAllPress={() => {
            track("button_clicked", {
              button: "See Hidden Collections",
              page: ScreenName.WalletNftGallery,
              drawer: "Filter selection",
            });
            onClose();
            navigation.navigate(NavigatorName.NftNavigator, {
              screen: ScreenName.HiddenNftCollections,
            });
          }}
        />
      </View>
    </QueuedDrawer>
  );
};

export default NftFilterDraw;
