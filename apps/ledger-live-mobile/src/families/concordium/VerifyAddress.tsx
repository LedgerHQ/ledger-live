import React, { useCallback, useEffect, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { filter, first, map } from "rxjs/operators";
import { TouchableOpacity, Linking, LayoutChangeEvent } from "react-native";
import { useSelector } from "~/context/hooks";
import { useTranslation, Trans } from "~/context/Locale";
import {
  ConcordiumAddressVerificationFailedError,
  ConcordiumTrustedMetadataServiceError,
} from "@ledgerhq/errors";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeature } from "@features/platform-feature-flags";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { track, TrackScreen } from "~/analytics";
import PreventNativeBack from "~/components/PreventNativeBack";
import SkipLock from "~/components/behaviour/SkipLock";
import logger from "../../logger";
import { rejectionOp } from "~/logic/debugReject";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import Button from "~/components/Button";
import Animation from "~/components/Animation";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import Illustration from "~/images/illustration/Illustration";
import { urls } from "~/utils/urls";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { e2eBridgeClient } from "../../../e2e/bridge/client";
import { useTrackReceiveFlow } from "~/analytics/hooks/useTrackReceiveFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import { getFreshAccountAddress } from "~/utils/address";

const illustrations = {
  dark: require("~/images/illustration/Dark/_080.webp"),
  light: require("~/images/illustration/Light/_080.webp"),
};

type Props = StackNavigatorProps<ReceiveFundsStackParamList, ScreenName.ReceiveVerifyAddress>;

const AnimationContainer = styled(Flex).attrs({
  alignSelf: "stretch",
  alignItems: "center",
  justifyContent: "center",
  height: "auto",
  mt: 8,
})``;

export default function ConcordiumReceiveVerifyAddress({ navigation, route }: Props) {
  const verifyAddressFeature = useFeature("concordiumVerifyAddress");
  const { theme: themeKind } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);
  const { t } = useTranslation();
  const [error, setError] = useState<Error | null>(null);

  const animatedHeight = useSharedValue(0);
  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      if (layout.height > 0) {
        animatedHeight.value = withTiming(layout.height, { duration: 200 });
      }
    },
    [animatedHeight],
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: animatedHeight.value > 0 ? animatedHeight.value : undefined,
    }),
    [animatedHeight],
  );

  useTrackReceiveFlow({
    location: HOOKS_TRACKING_LOCATIONS.receiveFlow,
    device: useSelector(lastConnectedDeviceSelector),
    error,
  });

  const onModalClose = useCallback(() => {
    setError(null);
  }, []);

  const sub = useRef<Subscription | undefined>(undefined);

  const { onSuccess, onError, device } = route.params;

  const verifyOnDevice = useCallback(
    async (device: Device): Promise<void> => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);

      sub.current?.unsubscribe();
      sub.current = (
        mainAccount.id.startsWith("mock")
          ? e2eBridgeClient.pipe(
              filter(msg => msg.type === "mockDeviceEvent"),
              first(),
              map(() => ({})),
              rejectionOp(),
            )
          : (await getAccountBridge(mainAccount)).receive(mainAccount, {
              deviceId: device.deviceId,
              verify: true,
            })
      ).subscribe({
        complete: () => {
          if (onSuccess) onSuccess(mainAccount.freshAddress);
          else
            navigation.navigate(ScreenName.ReceiveConfirmation, {
              ...route.params,
              verified: true,
              createTokenAccount: false,
            });
        },
        error: (error: Error) => {
          // Trusted metadata service couldn't answer (network failure, 5xx,
          // malformed response). Route to Confirmation with verified: false —
          // the native "skipped verification" path that shows the cached
          // address with the security modal prompt.
          if (error instanceof ConcordiumTrustedMetadataServiceError) {
            navigation.navigate(ScreenName.ReceiveConfirmation, {
              ...route.params,
              verified: false,
            });
            return;
          }
          if (error && error.name !== "UserRefusedAddress") {
            logger.critical(error);
          }
          setError(error);
          if (onError) onError();
        },
      });
    },
    [account, navigation, onError, onSuccess, parentAccount, route.params],
  );

  const mainAccount = account && getMainAccount(account, parentAccount);
  const currency = route.params?.currency || (account && getAccountCurrency(account));

  const onRetry = useCallback(() => {
    track("button_clicked", { button: "Retry" });
    onModalClose();
    if (device) {
      verifyOnDevice(device);
    }
  }, [device, onModalClose, verifyOnDevice]);

  const goBack = useCallback(() => {
    track("button_clicked", { button: "Cancel" });
    navigation.navigate(ScreenName.ReceiveConfirmation, {
      ...route.params,
      verified: false,
    });
  }, [navigation, route.params]);

  const redirectToSupport = useCallback(() => {
    track("message_clicked", {
      message: "contact us asap",
      url: urls.receiveVerifyAddress,
    });
    Linking.openURL(urls.receiveVerifyAddress);
  }, []);

  useEffect(() => {
    // When the on-device verify flag is off, skip the device prompt and route
    // straight to Confirmation — the family-specific PostAlert renders the
    // "it is not possible to verify…" notice there.
    if (verifyAddressFeature?.enabled !== true) {
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        ...route.params,
        verified: false,
      });
      return;
    }
    if (device) {
      verifyOnDevice(device);
    }
    return () => sub.current?.unsubscribe();
  }, [verifyAddressFeature?.enabled, device, verifyOnDevice, navigation, route.params]);

  if (!account || !currency || !mainAccount || !device) return null;
  if (verifyAddressFeature?.enabled !== true) return null;

  // Retrying a terminal address-verification refusal would just hit the same
  // 4xx again — hide the button for that class of error.
  const canRetry = !(error instanceof ConcordiumAddressVerificationFailedError);

  return (
    <SafeAreaViewFixed isFlex edges={["left", "right", "bottom"]}>
      <PreventNativeBack />
      <SkipLock />
      <SyncSkipUnderPriority priority={100} />
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <Flex onLayout={onLayout} flex={1}>
          {error ? (
            <>
              <TrackScreen category="Deposit" name="Address Verification Denied" />
              <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
                <Illustration
                  lightSource={illustrations.light}
                  darkSource={illustrations.dark}
                  size={240}
                />
                <LText variant="h4" bold textAlign="center" mb={6}>
                  {t("transfer.receive.verifyAddress.cancel.title")}
                </LText>
                <LText variant="body" color="neutral.c70" textAlign="center" mb={6}>
                  {t("transfer.receive.verifyAddress.cancel.subtitle")}
                </LText>

                <TouchableOpacity onPress={redirectToSupport}>
                  <LText variant="body" color="neutral.c70" textAlign="center">
                    <Trans i18nKey="transfer.receive.verifyAddress.cancel.info">
                      <LText color="primary.c80" style={{ textDecorationLine: "underline" }} />
                    </Trans>
                  </LText>
                </TouchableOpacity>
              </Flex>
              <Flex p={6} flexDirection="row" justifyContent="space-between" alignItems="center">
                <Button flex={1} type="secondary" outline onPress={goBack}>
                  {t("common.cancel")}
                </Button>
                {canRetry && (
                  <Button flex={1} type="main" ml={6} outline={false} onPress={onRetry}>
                    {t("common.retry")}
                  </Button>
                )}
              </Flex>
            </>
          ) : (
            <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
              <TrackScreen category="Deposit" name="Verify Address" />
              <LText variant="h4" textAlign="center" mb={6} testID={"receive-verifyAddress-title"}>
                {t("transfer.receive.verifyAddress.title")}
              </LText>
              <LText variant="body" color="neutral.c70" textAlign="center">
                {t("transfer.receive.verifyAddress.subtitle")}
              </LText>
              <Flex mt={10} bg={"neutral.c30"} borderRadius={8} p={6} mx={6}>
                <LText semiBold textAlign="center" testID={"receive-verifyAddress-freshAdress"}>
                  {getFreshAccountAddress(mainAccount)}
                </LText>
              </Flex>
              <AnimationContainer>
                <Animation
                  style={{ width: "100%" }}
                  source={getDeviceAnimation({
                    modelId: device.modelId,
                    key: "verify",
                    theme: themeKind,
                  })}
                />
              </AnimationContainer>
            </Flex>
          )}
        </Flex>
      </Animated.View>
    </SafeAreaViewFixed>
  );
}
