import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import React, { useCallback, memo, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap, type DeviceConnectionResult } from "@ledgerhq/live-dmk-shared";
import { ConnectNewDevice } from "LLM/components/ConnectNewDevice";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Flex, Icons, SlideIndicator } from "@ledgerhq/native-ui";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { DeviceOnboardingCloseBar } from "LLM/features/DeviceOnboarding/components/CloseBar";
import {
  useDeviceOnboardingHost,
  useDeviceOnboardingSession,
} from "LLM/features/DeviceOnboarding/hooks/DeviceOnboardingProvider";
import { useOfferSync } from "LLM/features/DeviceOnboarding/hooks/useOfferSync";
import { selectPairedKnownDevices } from "LLM/features/DeviceOnboarding/utils/pairedDevice";
import { shouldRevealFunnel } from "LLM/features/DeviceOnboarding/utils/pairingHold";
import { useSelector, useDispatch } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { ConnectDevice } from "./setupDevice/scenes";
import SeedWarning from "../shared/SeedWarning";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsReborn,
  setOnboardingHasDevice,
} from "~/actions/settings";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import {
  RootComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "~/components/RootNavigator/types/BaseOnboardingNavigator";
import styled from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
import Button from "~/components/PreventDoubleClickButton";
import { knownDevicesSelector } from "~/reducers/knownDevices";
import {
  hasCompletedOnboardingSelector,
  onboardingTypeSelector,
  readOnlyModeEnabledSelector,
} from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { useFeature } from "@features/platform-feature-flags";
import {
  isSeededDeviceFunnelOn,
  isUnseededDeviceFunnelOn,
} from "LLM/features/DeviceOnboarding/utils/seededFunnel";

const StyledContainerView = styled(Flex)`
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 32px;
  flex: 1;
`;

type NavigationProps = RootComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingPairNew>
>;

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

const ImageHeader = ({ showSlideIndicator }: { showSlideIndicator: boolean }) => {
  const navigation = useNavigation<NavigationProps["navigation"]>();

  function renderArrowLeft() {
    return <Icons.ArrowLeft />;
  }

  function renderInformation() {
    return <Icons.Information />;
  }

  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      height={48}
    >
      <Button Icon={renderArrowLeft} onPress={() => navigation.goBack()} />
      {showSlideIndicator && <SlideIndicator slidesLength={10} activeIndex={8} />}
      <Flex width={48}>
        <Button
          Icon={renderInformation}
          onPress={() => navigation.navigate(ScreenName.OnboardingBluetoothInformation)}
        />
      </Flex>
    </Flex>
  );
};

export default memo(function () {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const isFocused = useIsFocused();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const { notifyFlowCompleted } = useNotificationsPrompt();

  const {
    deviceModelId,
    showSeedWarning,
    isProtectFlow,
    fromAccessExistingWallet,
    isRestoreSeed,
    connectSeededDevice,
    connectUnseededDevice,
  } = route.params;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);

  const isFundWalletEnabled = Boolean(useFeature("llmNanoOnboardingFundWallet")?.enabled);
  const deviceOnboardingEnabled = Boolean(useFeature("deviceOnboarding")?.enabled);
  const seededFunnel = isSeededDeviceFunnelOn(
    deviceOnboardingEnabled,
    connectSeededDevice === true,
  );
  const unseededFunnel = isUnseededDeviceFunnelOn(
    deviceOnboardingEnabled,
    connectUnseededDevice === true,
  );
  const opensConnectNewDevice = seededFunnel || unseededFunnel;
  const isFundWalletNewSetup = isFundWalletEnabled && onboardingType === OnboardingType.setupNew;
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [wasReadOnlyAtEntry] = useState(readOnlyModeEnabled);
  const [awaitingRoute, setAwaitingRoute] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<Device>();
  const revealed = useRef(false);
  const dmk = useDeviceManagementKit();
  const offerSync = useOfferSync();
  const knownDevices = useSelector(knownDevicesSelector);
  const pairedKnownDevices = useMemo(
    () => selectPairedKnownDevices(knownDevices, pairedDevice?.deviceId),
    [knownDevices, pairedDevice?.deviceId],
  );
  const host = useMemo(
    () => ({
      navigation,
      dmk,
      knownDevices: pairedKnownDevices,
      offerSync,
      wasReadOnlyAtEntry,
    }),
    [dmk, navigation, offerSync, pairedKnownDevices, wasReadOnlyAtEntry],
  );
  useDeviceOnboardingHost(host);
  const session = useDeviceOnboardingSession();
  const { adopt, discard } = session;

  const seedConfiguration = useMemo(() => {
    let config = fromAccessExistingWallet ? "" : "new_seed";
    if (isProtectFlow) {
      config = "recover_seed";
    } else if (isRestoreSeed) {
      config = "restore_seed";
    }
    return config;
  }, [isProtectFlow, fromAccessExistingWallet, isRestoreSeed]);

  const onFinish = useCallback(
    (pairedDevice?: Device) => {
      if (isProtectFlow && deviceModelId) {
        // only used for protect for now
        navigation.navigate(ScreenName.OnboardingProtectFlow, {
          deviceModelId,
        });
        return;
      }
      if (opensConnectNewDevice) {
        navigation.replace(ScreenName.DeviceOnboardingFunnel, {
          pairedDeviceId: pairedDevice?.deviceId,
          wasReadOnlyAtEntry,
          ...(unseededFunnel ? { connectUnseededDevice: true } : {}),
        });
        return;
      }
      dispatch(setIsReborn(false));
      if (!hasCompletedOnboarding) {
        dispatch(setOnboardingHasDevice(true));
      }
      dispatch(completeOnboarding());

      const parentNav =
        navigation.getParent<
          StackNavigatorNavigation<BaseOnboardingNavigatorParamList, NavigatorName.Onboarding>
        >();
      if (parentNav) {
        parentNav.popToTop();
      }

      if (isFundWalletNewSetup) {
        navigation.navigate(ScreenName.OnboardingSecureYourCrypto, {
          deviceModelId,
        });
      } else {
        if (!fromAccessExistingWallet) {
          track("Onboarding - End", { seedConfiguration, deviceModelId, flow: "onboarding" });
        }
        navigation.replace(NavigatorName.Base, {
          screen: NavigatorName.Main,
        });
      }

      dispatch(setHasBeenUpsoldProtect(false));
      if (!fromAccessExistingWallet) {
        dispatch(setHasBeenRedirectedToPostOnboarding(false));
      }

      notifyFlowCompleted("onboarding");
    },
    [
      isProtectFlow,
      deviceModelId,
      dispatch,
      hasCompletedOnboarding,
      navigation,
      fromAccessExistingWallet,
      notifyFlowCompleted,
      isFundWalletNewSetup,
      seedConfiguration,
      opensConnectNewDevice,
      unseededFunnel,
      wasReadOnlyAtEntry,
    ],
  );

  useEffect(() => {
    if (!awaitingRoute || revealed.current) return;
    if (!shouldRevealFunnel(session.state, session.error)) return;
    revealed.current = true;
    onFinish(pairedDevice);
  }, [awaitingRoute, onFinish, pairedDevice, session.error, session.state]);

  const onNewDeviceConnected = useCallback(
    (result: DeviceConnectionResult) => {
      const pairedDevice: Device = {
        deviceId: result.compatDeviceId,
        deviceName: result.compatDeviceName,
        modelId: dmkToLedgerDeviceIdMap[result.connectedDevice.modelId],
        wired: result.compatDeviceWired,
      };
      if (!opensConnectNewDevice) {
        onFinish(pairedDevice);
        return;
      }
      setPairedDevice(pairedDevice);
      setAwaitingRoute(true);
      adopt(result);
    },
    [adopt, onFinish, opensConnectNewDevice],
  );

  const closeNewDevice = useCallback(() => {
    if (awaitingRoute && !revealed.current) {
      discard();
      setAwaitingRoute(false);
    }
    navigation.goBack();
  }, [awaitingRoute, discard, navigation]);

  const openDeviceSelection = useCallback(() => {
    // The device list then helps the user set up, without a new Bluetooth pairing.
    navigation.navigate(ScreenName.OnboardingDeviceSelection, { missingDevice: true });
  }, [navigation]);

  if (opensConnectNewDevice) {
    return (
      <Box lx={{ flex: 1, backgroundColor: "canvas" }} style={{ paddingBottom: bottomInset }}>
        <DeviceOnboardingCloseBar
          label={t("common.close")}
          testID="onboarding-connect-close"
          onPress={closeNewDevice}
        />
        <Box lx={{ flex: 1 }}>
          {isFocused || awaitingRoute ? (
            <ConnectNewDevice
              onConnected={onNewDeviceConnected}
              onClose={closeNewDevice}
              onDeviceNotFound={openDeviceSelection}
            />
          ) : null}
        </Box>
      </Box>
    );
  }

  return (
    <StyledSafeAreaView>
      <TrackScreen
        category="Onboarding"
        name="PairNew"
        seedConfiguration={seedConfiguration}
        deviceModelId={deviceModelId}
      />
      <ImageHeader showSlideIndicator={isFundWalletNewSetup} />
      <StyledContainerView>
        <ConnectDevice onSuccess={onFinish} keepReadOnlyMode={seededFunnel} />
      </StyledContainerView>
      {showSeedWarning && deviceModelId ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </StyledSafeAreaView>
  );
});
