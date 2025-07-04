import React from "react";
import NavigationScrollView from "~/components/NavigationScrollView";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  isDatadogEnabled,
  clientTokenVar,
  applicationIdVar,
  clientToken,
  applicationId,
} from "~/datadog";
import Config from "react-native-config";

export default function DatadogRum() {
  const { colors } = useTheme();

  return (
    <NavigationScrollView style={{ flex: 1, marginBottom: 16 }}>
      <Flex p={4}>
        <Text variant="body" color={colors.primary}>
          {isDatadogEnabled ? "Datadog RUM is enabled" : "Datadog RUM is disabled"}
        </Text>
        <Text variant="body" color={colors.primary}>
          {JSON.stringify(
            {
              clientToken: clientToken || "Not set",
              applicationId: applicationId || "Not set",
              env: Config.DATADOG_ENV || "Not set",
              site: Config.DATADOG_SITE || "Not set",
              serviceName: Config.APP_NAME || "Not set",
              clientTokenVar,
              applicationIdVar,
            },
            null,
            2,
          )}
        </Text>
      </Flex>
    </NavigationScrollView>
  );
}
