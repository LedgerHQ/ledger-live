import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import SettingsRow from "~/components/SettingsRow";
import { NavigatorName, ScreenName } from "~/const";

export default function CustomImage() {
  const navigation = useNavigation();
  const handlePressStax = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep0Welcome,
      params: {
        device: null,
        deviceModelId: DeviceModelId.stax,
      },
    });
  }, [navigation]);

  const handlePressEuropa = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep0Welcome,
      params: {
        device: null,
        deviceModelId: DeviceModelId.europa,
      },
    });
  }, [navigation]);

  return (
    <>
      <SettingsRow
        title="Custom lockscreen Stax"
        desc="Convenient access to the flow"
        iconLeft={<IconsLegacy.StaxMedium size={32} color="black" />}
        onPress={handlePressStax}
      />
      <SettingsRow
        title="Custom lockscreen Europa"
        desc="Convenient access to the flow"
        iconLeft={<IconsLegacy.EuropaMedium size={32} color="black" />}
        onPress={handlePressEuropa}
      />
    </>
  );
}
