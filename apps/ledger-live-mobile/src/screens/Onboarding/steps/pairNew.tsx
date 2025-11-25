import React, { useCallback, memo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useDispatch, useSelector } from "react-redux";
import { NavigatorName, ScreenName } from "~/const";
import { ConnectDevice } from "./setupDevice/scenes";
import { TrackScreen } from "~/analytics";
import SeedWarning from "../shared/SeedWarning";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsReborn,
  setOnboardingHasDevice,
} from "~/actions/settings";
import useNotifications from "~/logic/notifications";
import {
  RootComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "~/components/RootNavigator/types/BaseOnboardingNavigator";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "~/components/PreventDoubleClickButton";
import { hasCompletedOnboardingSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

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

const ImageHeader = () => {
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
  const { triggerJustFinishedOnboardingNewDevicePushNotificationModal } = useNotifications();

  const { deviceModelId, showSeedWarning, isProtectFlow, fromAccessExistingWallet } = route.params;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);

  const isFundWalletEnabled = Boolean(useFeature("llmNanoOnboardingFundWallet")?.enabled);

  const onFinish = useCallback(() => {
    if (isProtectFlow && deviceModelId) {
      // only used for protect for now
      navigation.navigate(ScreenName.OnboardingProtectFlow, {
        deviceModelId,
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

    if (isFundWalletEnabled && onboardingType === OnboardingType.setupNew) {
      navigation.navigate(ScreenName.OnboardingSecureYourCrypto);
    } else {
      navigation.replace(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
    }

    dispatch(setHasBeenUpsoldProtect(false));
    if (!fromAccessExistingWallet) {
      dispatch(setHasBeenRedirectedToPostOnboarding(false));
    }

    triggerJustFinishedOnboardingNewDevicePushNotificationModal();
  }, [
    isProtectFlow,
    deviceModelId,
    dispatch,
    hasCompletedOnboarding,
    navigation,
    fromAccessExistingWallet,
    triggerJustFinishedOnboardingNewDevicePushNotificationModal,
    onboardingType,
    isFundWalletEnabled,
  ]);

  return (
    <StyledSafeAreaView>
      <TrackScreen category="Onboarding" name="PairNew" />
      <ImageHeader />
      <StyledContainerView>
        <ConnectDevice onSuccess={onFinish} />
      </StyledContainerView>
      {showSeedWarning && deviceModelId ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </StyledSafeAreaView>
  );
});
