import React, { useCallback } from "react";

import { Linking } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useNavigation } from "@react-navigation/native";

import { urls } from "../config/urls";
import { NavigatorName, ScreenName } from "../const";

const BuyDeviceCTA: React.FC<Record<string, never>> = () => {
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const navigation = useNavigation();

  const onBuyDevicePress = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(NavigatorName.BuyDevice, {
        screen: ScreenName.PurchaseDevice,
      });
    } else {
      Linking.openURL(urls.buyNanoX);
    }
  }, [navigation, buyDeviceFromLive?.enabled]);

  return (
    <Text variant="paragraph" fontWeight="semiBold">
      <Trans i18nKey="manager.selectDevice.buyDeviceCTA">
        <Text>{"Need a new Ledger? "}</Text>
        <Text color="primary.c90" onPress={onBuyDevicePress}>
          {"Buy now"}
        </Text>
      </Trans>
    </Text>
  );
};

export default BuyDeviceCTA;
