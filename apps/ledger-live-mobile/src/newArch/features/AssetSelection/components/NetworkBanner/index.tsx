import React from "react";
import { BannerCard, Flex } from "@ledgerhq/native-ui";

import { ChartNetworkMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default NetworkBanner;
