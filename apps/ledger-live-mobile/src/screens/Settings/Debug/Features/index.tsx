import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import { ScreenName } from "../../../../const";
import BLEPairingFlow from "./BLEPairingFlow";
import CustomImage from "./CustomImage";
import ClaimNftFlowDebug from "./ClaimNftFlowDebug";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "../../../../components/RootNavigator/types/SettingsNavigator";

export default function Features() {
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
      {/* Split all the custom lockscreen screens into a separate menu maybe? */}
      <CustomImage />
      <SettingsRow
        title="Custom lockscreen fetch"
        desc="Fetch & restore from a connected device"
        iconLeft={<Icons.BracketsMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFetchCustomImage)}
      />
      <SettingsRow
        title="Firmware Update"
        desc="Test the firmware update feature. USE AT YOUR OWN RISK!"
        iconLeft={<Icons.NanoFirmwareUpdateMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFirmwareUpdate)}
      />
      <SettingsRow
        title="Custom lockscreen graphics"
        desc="Tool for testing the flow's graphics"
        iconLeft={<Icons.BringFrontMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCustomImageGraphics)}
      />
      <ClaimNftFlowDebug />
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
        title="Install set of apps"
        desc="Multi app install feature test"
        iconLeft={<Icons.MugHotMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugInstallSetOfApps)}
      />
      <SettingsRow
        title="Videos"
        desc="See all video assets"
        iconLeft={<Icons.PlayMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugVideos)}
      />
      <SettingsRow
        title="Storyly"
        desc="Remote video slides (stories) used on the new onboarding"
        iconLeft={<Icons.InstagramMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugStoryly)}
      />

      <SettingsRow
        title="Terms of Use"
        desc="Trigger Terms of Use Popup"
        iconLeft={<Icons.LinkMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTermsOfUse)}
      />

      <SettingsRow
        title="Successive drawers opening/closing"
        desc="Open and close several bottom drawers"
        iconLeft={<Icons.LayersMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugQueuedDrawers)}
      />
    </SettingsNavigationScrollView>
  );
}
