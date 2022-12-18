import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { ScreenName } from "../../../../const";
import BLEPairingFlow from "./BLEPairingFlow";
import CustomImage from "./CustomImage";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";

export default function Debugging() {
  const navigation =
    useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Swap"
        desc="KYC skips, toggle providers, etc"
        iconLeft={<Icons.TradeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugSwap)}
      />
      <SettingsRow
        title="Export accounts"
        desc="Generate a LiveQR stream to be imported on another LLM"
        iconLeft={<Icons.QrCodeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugExport)}
      />
      <BLEPairingFlow />
      <CustomImage />
      <SettingsRow
        title="Custom lockscreen fetch"
        desc="Fetch & restore from a connected device"
        iconLeft={<Icons.LedgerBlueMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCustomImageGraphics)}
      />
      <SettingsRow
        title="Custom lockscreen graphics"
        desc="Tool for testing the flow's graphics"
        iconLeft={<Icons.LedgerBlueMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCustomImageGraphics)}
      />
      <SettingsRow
        title="Post Onboarding"
        desc="Entry to the post onboarding flow"
        iconLeft={<Icons.UserMedium size={32} color="black" />}
        onPress={() =>
          navigation.navigate(ScreenName.PostOnboardingDebugScreen)
        }
      />
      <SettingsRow
        title="Lotties"
        desc="See all lottie animations per device in one screen"
        iconLeft={<Icons.VideoMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugLottie)}
      />
      <SettingsRow
        title="Storyly"
        desc="Remote video slides used on the new onboarding"
        iconLeft={<Icons.PlayMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugStoryly)}
      />
    </SettingsNavigationScrollView>
  );
}
