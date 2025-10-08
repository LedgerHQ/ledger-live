import React from "react";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { View } from "react-native";
import Alert from "~/components/Alert";

type Props = {
  currencyConfig?: CurrencyConfig;
};

const WarningCustomBanner = ({ currencyConfig }: Props) => {
  if (!currencyConfig) return null;
  const banner = currencyConfig.customBanner;
  if (banner?.isDisplay) {
    return (
      <View testID="generic-banner" style={{ marginTop: 16 }}>
        <Alert
          key="generic_banner"
          type="warning"
          learnMoreText={banner.bannerLinkText}
          learnMoreUrl={banner.bannerLink}
        >
          {banner.bannerText}
        </Alert>
      </View>
    );
  }
  return null;
};

export default WarningCustomBanner;
