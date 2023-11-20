import React, { useCallback } from "react";

import { Linking } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
<<<<<<< HEAD
<<<<<<< HEAD
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
=======
import { useFeature } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
>>>>>>> 5795ae130c (fix: snackcase for folder name)
import { useNavigation } from "@react-navigation/native";

import { urls } from "@utils/urls";
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
