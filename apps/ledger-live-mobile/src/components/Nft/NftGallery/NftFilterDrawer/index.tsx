import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import { TrackScreen } from "../../../../analytics";
import NftFilterSection from "./NftFilterSection";
import { NftFilterCurrencyItem } from "./NftFilterItem";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { NftGalleryChainFiltersState } from "../../../../reducers/types";
import { NavigatorName, ScreenName } from "../../../../const/navigation";
import { useNavigation } from "@react-navigation/native";
import { track } from "../../../../analytics";

type Props = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly toggleFilter: (filter: keyof NftGalleryChainFiltersState) => void;
  readonly filters: NftGalleryChainFiltersState;
};
const NftFilterDraw: FC<Props> = ({ onClose, isOpen, filters, toggleFilter }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <BottomDrawer
      isOpen={isOpen}
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
              onPress={() => toggleFilter(currencyId)}
            />
          );
        })}
      </NftFilterSection>
      <NftFilterSection
        title={t("wallet.nftGallery.filters.hiddenCollections")}
        onSeeAllPress={() => {
          track("button_clicked", {
            button: "See hidden collections",
            page: ScreenName.WalletNftGallery,
            drawer: "Filter selection",
          });
          onClose();
          navigation.navigate(NavigatorName.NftNavigator, {
            screen: ScreenName.HiddenNftCollections,
          });
        }}
      />
    </BottomDrawer>
  );
};

export default NftFilterDraw;
