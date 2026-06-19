import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Icons, IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import { useDispatch, useSelector } from "~/context/hooks";
import { debugOsUpdateBannerModeSelector } from "~/reducers/settings";
import { setDebugOsUpdateBannerMode } from "~/actions/settings";
import type { DebugOsUpdateBannerMode } from "~/reducers/types";

const OS_UPDATE_BANNER_OPTIONS: { value: DebugOsUpdateBannerMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "card", label: "Card" },
  { value: "compact", label: "Compact" },
];
import BLEPairingFlow from "./BLEPairingFlow";
import CustomImage from "./CustomImage";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { FeatureToggle } from "@features/platform-feature-flags";
import { InitialRange } from "~/components/RootNavigator/types/LandingPagesNavigator";
import InfoModal from "~/modals/Info";

export default function Features() {
  const [showBaseModalDemo, setShowBaseModalDemo] = useState(false);
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const dispatch = useDispatch();
  const osUpdateBannerMode = useSelector(debugOsUpdateBannerModeSelector);
  const navigateToLargeMover = () => {
    navigation.navigate(ScreenName.LargeMoverLandingPage, {
      currencyIds: "BTC,ETH,SOL",
      initialRange: InitialRange.Day,
      ledgerIds: "bitcoin,ethereum,solana,ethereum/erc20/usd__coin,ethereum/erc20/wrapped_bitcoin",
    });
  };
  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Swap"
        desc="Enable/disable swap providers"
        iconLeft={<IconsLegacy.TradeMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugSwap)}
      />

      <SettingsRow
        title="Device Intent Executor"
        desc="Test DeviceIntentExecutor orchestration and initialization"
        iconLeft={<IconsLegacy.NanoXFoldedMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugDeviceIntentExecutor)}
      />

      <BLEPairingFlow />
      {/* Split all the custom lockscreen screens into a separate menu maybe? */}
      <CustomImage />
      <SettingsRow
        title="Custom lockscreen fetch"
        desc="Fetch & restore from a connected device"
        iconLeft={<IconsLegacy.BracketsMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFetchCustomImage)}
      />
      <SettingsRow
        title="Firmware Update UI"
        desc="Test the firmware update feature. UI-only"
        iconLeft={<IconsLegacy.NanoFirmwareUpdateMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugFirmwareUpdate)}
      />
      <SettingsRow
        title="Device OS Update Banner"
        desc="Debug: force-show a banner variant on Wallet & My Ledger"
        iconLeft={<IconsLegacy.NanoFirmwareUpdateMedium size={24} color="black" />}
      />
      {OS_UPDATE_BANNER_OPTIONS.map(option => (
        <SettingsRow
          key={option.value}
          title={option.label}
          compact
          onPress={() => dispatch(setDebugOsUpdateBannerMode(option.value))}
        >
          {osUpdateBannerMode === option.value ? (
            <IconsLegacy.CheckAloneMedium size={20} color="black" />
          ) : null}
        </SettingsRow>
      ))}
      <SettingsRow
        title="Custom lockscreen graphics"
        desc="Tool for testing the flow's graphics"
        iconLeft={<IconsLegacy.BringFrontMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugCustomImageGraphics)}
      />
      <SettingsRow
        title="Post Onboarding"
        desc="Entry to the post onboarding flow"
        iconLeft={<IconsLegacy.UserMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.PostOnboardingDebugScreen)}
      />
      <SettingsRow
        title="Lotties"
        desc="See all lottie animations per device in one screen"
        iconLeft={<IconsLegacy.VideoMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugLottie)}
      />
      <SettingsRow
        title="Install set of apps"
        desc="Multi app install feature test"
        iconLeft={<IconsLegacy.MugHotMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugInstallSetOfApps)}
      />
      <SettingsRow
        title="Videos"
        desc="See all video assets"
        iconLeft={<IconsLegacy.PlayMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugVideos)}
      />
      <SettingsRow
        title="Tooltip"
        desc="Open a screen that demonstrates a tooltip"
        iconLeft={<IconsLegacy.InfoMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTooltip)}
      />
      <SettingsRow
        title="BaseModal demo"
        desc="Opens InfoModal (BaseModal-based)"
        iconLeft={<IconsLegacy.InfoMedium size={24} color="black" />}
        onPress={() => setShowBaseModalDemo(true)}
      />

      <SettingsRow
        title="Terms of Use"
        desc="Trigger Terms of Use Popup"
        iconLeft={<IconsLegacy.LinkMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTermsOfUse)}
      />

      <SettingsRow
        title="Successive drawers opening/closing"
        desc="Open and close several bottom drawers"
        iconLeft={<IconsLegacy.LayersMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugQueuedDrawers)}
      />

      <SettingsRow
        title="Snackbars"
        desc="Test toasts and other snackbars"
        iconLeft={<IconsLegacy.MailMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugSnackbars)}
      />

      <SettingsRow
        title="Transactions alerts"
        desc="See your addresses that are registered in chainwatch"
        iconLeft={<IconsLegacy.NotificationsMedium size={24} color="black" />}
        onPress={() => navigation.navigate(ScreenName.DebugTransactionsAlerts)}
      />

      <SettingsRow
        title="Large Mover"
        desc="See the large mover landing page"
        iconLeft={<Icons.Dollar />}
        onPress={navigateToLargeMover}
      />

      <SettingsRow
        title="Swiper"
        desc="Swipe cards"
        iconLeft={<Icons.CreditCard />}
        onPress={() => navigation.navigate(ScreenName.DebugSwipe)}
      />

      <FeatureToggle featureId="llmModularDrawer">
        <SettingsRow
          title="MAD"
          desc="Open & Debug Modular Asset Drawer"
          iconLeft={<Icons.CoinsCrypto />}
          onPress={() => navigation.navigate(ScreenName.DebugModularAssetDrawer)}
        />
      </FeatureToggle>
      <InfoModal
        isOpened={showBaseModalDemo}
        onClose={() => setShowBaseModalDemo(false)}
        data={[
          {
            title: "Demo title",
            description: "This InfoModal uses BaseModal under the hood.",
          },
        ]}
      />
    </SettingsNavigationScrollView>
  );
}
