import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import React, { useCallback, memo, useMemo, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Flex, Icons, SlideIndicator } from "@ledgerhq/native-ui";
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
import {
  hasCompletedOnboardingSelector,
  onboardingTypeSelector,
  readOnlyModeEnabledSelector,
} from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { useFeature } from "@features/platform-feature-flags";
import { isSeededDeviceFunnelOn } from "LLM/features/DeviceOnboarding/utils/seededFunnel";

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

  const dispatch = useDispatch();
  const { notifyFlowCompleted } = useNotificationsPrompt();

  const {
    deviceModelId,
    showSeedWarning,
    isProtectFlow,
    fromAccessExistingWallet,
    isRestoreSeed,
    connectSeededDevice,
  } = route.params;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);

  const isFundWalletEnabled = Boolean(useFeature("llmNanoOnboardingFundWallet")?.enabled);
  const seededFunnel = isSeededDeviceFunnelOn(
    Boolean(useFeature("deviceOnboarding")?.enabled),
    connectSeededDevice === true,
  );
  const isFundWalletNewSetup = isFundWalletEnabled && onboardingType === OnboardingType.setupNew;
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const [wasReadOnlyAtEntry] = useState(readOnlyModeEnabled);

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
      if (seededFunnel) {
        navigation.navigate(ScreenName.DeviceOnboardingFunnel, {
          pairedDeviceId: pairedDevice?.deviceId,
          wasReadOnlyAtEntry,
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
      seededFunnel,
      wasReadOnlyAtEntry,
    ],
  );

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
