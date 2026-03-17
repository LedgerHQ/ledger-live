import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { Trans } from "~/context/Locale";
import Animation from "~/components/Animation";
import { ConnectYourDevice } from "~/components/DeviceAction/rendering";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { CreateStatus, useOnboarding } from "../hooks/useOnboarding";

const RESEND_DELAY_SECONDS = 10;

type Props = Readonly<{
  currency: CryptoCurrency;
  device: Device;
  creatableAccount: Account;
  accountName: string | undefined;
  sessionTopic: string;
  onCreated: (completedAccount: Account) => void;
  onSessionExpired: () => void;
}>;

export default function StepCreate({
  currency,
  device,
  creatableAccount,
  accountName,
  sessionTopic,
  onCreated,
  onSessionExpired,
}: Props) {
  const { dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const { createStatus, confirmationCode, completedAccount, startOnboarding } = useOnboarding(
    currency,
    device.deviceId,
    creatableAccount,
    sessionTopic,
    onSessionExpired,
  );

  const [resendTimeRemaining, setResendTimeRemaining] = useState(RESEND_DELAY_SECONDS);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canResend = resendTimeRemaining === 0;

  const startCountdown = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    setResendTimeRemaining(RESEND_DELAY_SECONDS);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, RESEND_DELAY_SECONDS - elapsed);
      setResendTimeRemaining(remaining);
      if (remaining === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    if (createStatus !== CreateStatus.PREPARING) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startCountdown();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [createStatus, startCountdown]);

  const handleResend = useCallback(() => {
    startCountdown();
    startOnboarding();
  }, [startCountdown, startOnboarding]);

  return (
    <Flex flex={1} justifyContent="space-between">
      <ScrollView contentContainerStyle={scrollContent}>
        <Flex alignItems="center">
          <Text variant="h5" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="concordium.onboard.create.title" />
          </Text>

          {accountName && (
            <Text variant="body" color="neutral.c70" mb={6}>
              {accountName}
            </Text>
          )}

          {createStatus === CreateStatus.PREPARING && (
            <Flex alignItems="center" px={4}>
              <Text variant="body" color="neutral.c70" textAlign="center" mb={6}>
                <Trans i18nKey="concordium.onboard.create.prepare.title" />
              </Text>

              <Flex flexDirection="row" justifyContent="center">
                {confirmationCode.split("").map((digit, index) => (
                  <Flex
                    key={index}
                    width={52}
                    height={68}
                    borderWidth={2}
                    borderColor="neutral.c50"
                    backgroundColor="neutral.c20"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius={8}
                    mx={1}
                  >
                    <Text variant="h2" fontWeight="semiBold">
                      {digit}
                    </Text>
                  </Flex>
                ))}
              </Flex>

              <Flex mt={6}>
                {canResend ? (
                  <Button type="shade" onPress={handleResend}>
                    <Trans i18nKey="concordium.onboard.create.prepare.resendButton" />
                  </Button>
                ) : (
                  <Text variant="small" color="neutral.c60">
                    <Trans
                      i18nKey="concordium.onboard.create.prepare.resendDescription"
                      values={{ count: resendTimeRemaining }}
                    />
                  </Text>
                )}
              </Flex>
            </Flex>
          )}

          {createStatus === CreateStatus.DEVICE_LOCKED && (
            <ConnectYourDevice device={device} isLocked fullScreen={false} />
          )}

          {createStatus === CreateStatus.SUBMITTING && (
            <Flex alignItems="center">
              <Flex alignItems="center" justifyContent="center" height={150} mb={4}>
                <Animation
                  source={getDeviceAnimation({ modelId: device.modelId, key: "sign", theme })}
                  style={getDeviceAnimationStyles(device.modelId)}
                />
              </Flex>
              <Alert type="info">
                <Alert.BodyText>
                  <Trans i18nKey="concordium.onboard.create.keepDeviceNearby" />
                </Alert.BodyText>
              </Alert>
            </Flex>
          )}

          {createStatus === CreateStatus.SUCCESS && (
            <Alert type="success">
              <Alert.BodyText>
                <Trans i18nKey="concordium.onboard.create.success" />
              </Alert.BodyText>
            </Alert>
          )}

          {createStatus === CreateStatus.ERROR && (
            <Alert type="error">
              <Alert.BodyText>
                <Trans i18nKey="concordium.onboard.create.error" />
              </Alert.BodyText>
            </Alert>
          )}
        </Flex>
      </ScrollView>

      {createStatus === CreateStatus.SUCCESS && completedAccount && (
        <Flex px={6} pb={10}>
          <Button type="main" onPress={() => onCreated(completedAccount)} size="large">
            <Trans i18nKey="common.continue" />
          </Button>
        </Flex>
      )}

      {(createStatus === CreateStatus.DEVICE_LOCKED || createStatus === CreateStatus.ERROR) && (
        <Flex px={6} pb={10}>
          <Button type="main" onPress={startOnboarding}>
            <Trans i18nKey="common.retry" />
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

const scrollContent = {
  paddingHorizontal: 16,
  paddingTop: 24,
};
