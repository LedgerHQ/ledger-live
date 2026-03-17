import React from "react";
import { Linking, ScrollView, TouchableOpacity } from "react-native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { Trans } from "~/context/Locale";
import { urls } from "~/utils/urls";

export default function StepOnboard({ onAgree }: Readonly<{ onAgree: () => void }>) {
  const learnMoreUrl = useLocalizedUrl(urls.concordium.learnMore);

  return (
    <Flex flex={1} justifyContent="space-between">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Alert type="info" showIcon={false}>
          <Flex flexDirection="column" rowGap={16} px={4} pb={4}>
            <Text variant="h5" fontWeight="semiBold" textAlign="center">
              <Trans i18nKey="concordium.onboard.acknowledge.title" />
            </Text>

            <Text variant="body" color="neutral.c80">
              <Trans i18nKey="concordium.onboard.acknowledge.description" />
            </Text>

            {[1, 2, 3, 4].map(i => (
              <Text key={i} variant="body" color="neutral.c80">
                {"\u2022 "}
                <Trans i18nKey={`concordium.onboard.acknowledge.list.${i}`} />
              </Text>
            ))}

            <TouchableOpacity activeOpacity={0.5} onPress={() => Linking.openURL(learnMoreUrl)}>
              <Alert.UnderlinedText>
                <Trans i18nKey="common.learnMore" />
              </Alert.UnderlinedText>
            </TouchableOpacity>
          </Flex>
        </Alert>
      </ScrollView>

      <Flex px={6} pb={10}>
        <Button type="main" onPress={onAgree}>
          <Trans i18nKey="concordium.onboard.acknowledge.allow" />
        </Button>
      </Flex>
    </Flex>
  );
}
