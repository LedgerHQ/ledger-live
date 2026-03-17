import React from "react";
import { Linking, ScrollView } from "react-native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import ExternalLink from "~/components/ExternalLink";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { Trans } from "~/context/Locale";
import { urls } from "~/utils/urls";

type Props = Readonly<{
  onAgree: () => void;
  onCancel: () => void;
}>;

export default function StepOnboard({ onAgree, onCancel }: Props) {
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
              <Flex key={i} flexDirection="row" columnGap={8}>
                <Text variant="body" color="neutral.c80">
                  {"\u2022"}
                </Text>
                <Flex flexDirection="column" flex={1} rowGap={4}>
                  <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                    <Trans i18nKey={`concordium.onboard.acknowledge.list.${i}.title`} />
                  </Text>
                  <Text variant="body" color="neutral.c80">
                    <Trans i18nKey={`concordium.onboard.acknowledge.list.${i}.description`} />
                  </Text>
                </Flex>
              </Flex>
            ))}

            <Flex flexDirection="row" alignItems="center" flexWrap="wrap" columnGap={4}>
              <Text variant="body" color="neutral.c80">
                <Trans i18nKey="concordium.onboard.acknowledge.guide" />
              </Text>
              <ExternalLink
                text={<Trans i18nKey="common.learnMore" />}
                onPress={() => Linking.openURL(learnMoreUrl)}
              />
            </Flex>
          </Flex>
        </Alert>
      </ScrollView>

      <Flex px={6} pb={10} rowGap={16}>
        <Button type="main" onPress={onAgree} size="large">
          <Trans i18nKey="concordium.onboard.acknowledge.allow" />
        </Button>
        <Button type="default" onPress={onCancel}>
          <Trans i18nKey="common.cancel" />
        </Button>
      </Flex>
    </Flex>
  );
}
