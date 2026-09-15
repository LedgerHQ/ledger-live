import React from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import SettingsNavigationScrollView from "../../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export default function StartTour() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Product Tour"
        desc="Test product tour drawer"
        iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
        arrowRight
        onPress={() => navigation.navigate(ScreenName.DebugProductTour)}
      />
      <SettingsRow
        title="Q2 Wallet V4 Tour (Images)"
        desc="Test image-based Q2 Wallet V4 tour drawer"
        iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
        arrowRight
        onPress={() => navigation.navigate(ScreenName.DebugQ2WalletV4Tour)}
      />
      <SettingsRow
        title="Q3 Wallet V4 Tour"
        desc="Test image-based Q3 Wallet V4 tour drawer"
        iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
        arrowRight
        onPress={() => navigation.navigate(ScreenName.DebugQ3WalletV4Tour)}
      />
    </SettingsNavigationScrollView>
  );
}
