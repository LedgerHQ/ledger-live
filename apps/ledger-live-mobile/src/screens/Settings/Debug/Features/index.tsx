import React from "react";
import { useNavigation } from "@react-navigation/native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import BLEPairingFlow from "./BLEPairingFlow";
import CustomImage from "./CustomImage";
import ClaimNftFlowDebug from "./ClaimNftFlowDebug";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export default function Features() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Swap"
        desc="Enable/disable swap providers"
        iconLeft={<IconsLegacy.TradeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugSwap)}
      />
      <SettingsRow
        title="Export accounts"
        desc="Generate a LiveQR stream to be imported on another LLM"
        iconLeft={<IconsLegacy.QrCodeMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugExport)}
      />
      <BLEPairingFlow />
      {/* Split all the custom lockscreen screens into a separate menu maybe? */}
      <CustomImage />
      <SettingsRow
        title="Custom lockscreen fetch"
        desc="Fetch & restore from a connected device"
        iconLeft={<IconsLegacy.BracketsMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFetchCustomImage)}
      />
      <SettingsRow
        title="Firmware Update UI"
        desc="Test the firmware update feature. UI-only"
        iconLeft={<IconsLegacy.NanoFirmwareUpdateMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFirmwareUpdate)}
      />
      <SettingsRow
        title="Custom lockscreen graphics"
        desc="Tool for testing the flow's graphics"
        iconLeft={<IconsLegacy.BringFrontMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCustomImageGraphics)}
      />
      <ClaimNftFlowDebug />
      <SettingsRow
        title="Post Onboarding"
        desc="Entry to the post onboarding flow"
        iconLeft={<IconsLegacy.UserMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.PostOnboardingDebugScreen)}
      />
      <SettingsRow
        title="Lotties"
        desc="See all lottie animations per device in one screen"
        iconLeft={<IconsLegacy.VideoMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugLottie)}
      />
      <SettingsRow
        title="Install set of apps"
        desc="Multi app install feature test"
        iconLeft={<IconsLegacy.MugHotMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugInstallSetOfApps)}
      />
      <SettingsRow
        title="Videos"
        desc="See all video assets"
        iconLeft={<IconsLegacy.PlayMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugVideos)}
      />
      <SettingsRow
        title="Storyly"
        desc="Remote video slides (stories) used on the new onboarding"
        iconLeft={<IconsLegacy.InstagramMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugStoryly)}
      />

      <SettingsRow
        title="Terms of Use"
        desc="Trigger Terms of Use Popup"
        iconLeft={<IconsLegacy.LinkMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTermsOfUse)}
      />

      <SettingsRow
        title="Successive drawers opening/closing"
        desc="Open and close several bottom drawers"
        iconLeft={<IconsLegacy.LayersMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugQueuedDrawers)}
      />

      <SettingsRow
        title="Snackbars"
        desc="Test toasts and other snackbars"
        iconLeft={<IconsLegacy.MailMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugSnackbars)}
      />

      <SettingsRow
        title="Transactions alerts"
        desc="See your addresses that are registered in chainwatch"
        iconLeft={<IconsLegacy.NotificationsMedium size={32} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTransactionsAlerts)}
      />
    </SettingsNavigationScrollView>
  );
}
