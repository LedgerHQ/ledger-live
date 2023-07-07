import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import { TrackScreen } from "../../../../analytics";
import NftFilterSection from "./NftFilterSection";
import { NftFilterCurrencyItem } from "./NftFilterItem";
import { BottomDrawer } from "@ledgerhq/native-ui";
import { NftGalleryChainFiltersState } from "../../../../reducers/types";

type Props = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly toggleFilter: (filter: keyof NftGalleryChainFiltersState) => void;
  readonly filters: NftGalleryChainFiltersState;
};
const NftFilterDraw: FC<Props> = ({ onClose, isOpen, filters, toggleFilter }) => {
  const { t } = useTranslation();
  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose}>
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
    </BottomDrawer>
  );
};

export default NftFilterDraw;
