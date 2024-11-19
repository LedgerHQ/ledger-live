import React, { useEffect } from "react";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useLoadingStep } from "../../hooks/useLoadingStep";
import { TrackScreen } from "~/analytics";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import GradientContainer from "~/components/GradientContainer";
import Animation from "~/components/Animation";
import { Flex, Text } from "@ledgerhq/native-ui";
import lottie from "~/screens/ReceiveFunds/assets/lottie.json";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { completeOnboarding } from "~/actions/settings";
import PreventNativeBack from "~/components/PreventNativeBack";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncLoading>
>;

export function ActivationLoading({ route }: Props) {
  const { created } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const title = "walletSync.loading.title";
  const subtitle = created ? "walletSync.loading.activation" : "walletSync.loading.synch";
  useLoadingStep(created);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      dispatch(completeOnboarding());
    }
  }, [dispatch, hasCompletedOnboarding]);

  return (
    <>
      <PreventNativeBack />
      <TrackScreen category={AnalyticsPage.Loading} />
      <GradientContainer
        color={colors.background.main}
        startOpacity={1}
        endOpacity={0}
        containerStyle={{ borderRadius: 0, position: "absolute", bottom: 0, left: 0 }}
        gradientStyle={{ zIndex: 1 }}
      >
        <Animation style={{ width: "100%" }} source={lottie} />
      </GradientContainer>
      <Flex flex={1} position="relative">
        <Flex flex={1} alignItems="center" justifyContent="center" m={6}>
          <Text variant="h4" fontWeight="semiBold" textAlign="center">
            {t(title)}
          </Text>
          <Text mt={6} textAlign="center" variant="body" fontWeight="medium" color="neutral.c80">
            {t(subtitle)}
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
