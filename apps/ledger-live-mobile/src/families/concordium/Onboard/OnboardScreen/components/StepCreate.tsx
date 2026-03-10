import React from "react";
import { ScrollView } from "react-native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { Trans } from "~/context/Locale";
import { CreateStatus, useOnboarding } from "../hooks/useOnboarding";

type Props = Readonly<{
  currency: CryptoCurrency;
  deviceId: string;
  creatableAccount: Account;
  sessionTopic: string;
  onCreated: () => void;
  onSessionExpired: () => void;
}>;

export default function StepCreate({
  currency,
  deviceId,
  creatableAccount,
  sessionTopic,
  onCreated,
  onSessionExpired,
}: Props) {
  const { createStatus, confirmationCode, startOnboarding } = useOnboarding(
    currency,
    deviceId,
    creatableAccount,
    sessionTopic,
    onCreated,
    onSessionExpired,
  );

  return (
    <Flex flex={1} justifyContent="space-between">
      <ScrollView contentContainerStyle={scrollContent}>
        <Flex alignItems="center">
          <Text variant="h5" fontWeight="semiBold" mb={6}>
            <Trans i18nKey="concordium.onboard.create.title" />
          </Text>

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
            </Flex>
          )}

          {createStatus === CreateStatus.SUBMITTING && (
            <Alert type="info">
              <Text>
                <Trans i18nKey="concordium.onboard.create.keepDeviceNearby" />
              </Text>
            </Alert>
          )}

          {createStatus === CreateStatus.SUCCESS && (
            <Alert type="success">
              <Text>
                <Trans i18nKey="concordium.onboard.create.success" />
              </Text>
            </Alert>
          )}

          {createStatus === CreateStatus.ERROR && (
            <Alert type="error">
              <Text>
                <Trans i18nKey="concordium.onboard.create.error" />
              </Text>
            </Alert>
          )}
        </Flex>
      </ScrollView>

      {createStatus === CreateStatus.ERROR && (
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
