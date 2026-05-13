import React from "react";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet } from "react-native";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

export default function DebugDeviceIntentExecutor() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Flex p={3} backgroundColor="primary.c10" borderRadius={8} mb={4}>
        <Text variant="subtitle" mb={2}>
          Device Intent Executor Debug
        </Text>
        <Text variant="small" color="neutral.c70">
          Pick the area of the Device Intent Executor you want to exercise.
        </Text>
      </Flex>

      <DebugEntry
        title="Device Action Content"
        description="Preview the reusable mobile component for device action copy, banner, and lotties."
        onPress={() => navigation.navigate(ScreenName.DebugDeviceIntentExecutorContent)}
      />
      <DebugEntry
        title="Info State"
        description="Preview the reusable mobile state component for presets, copy, banners, and actions."
        onPress={() => navigation.navigate(ScreenName.DebugDeviceIntentExecutorInfoState)}
      />
      <DebugEntry
        title="Orchestration"
        description="Run the existing chained intent playground to test DIE core orchestration."
        onPress={() => navigation.navigate(ScreenName.DebugDeviceIntentExecutorOrchestration)}
      />
      <DebugEntry
        title="Initialization"
        description="Run one echo intent after initialization to inspect the extracted device context."
        onPress={() => navigation.navigate(ScreenName.DebugDeviceIntentExecutorInitialization)}
      />
    </ScrollView>
  );
}

function DebugEntry({
  title,
  description,
  onPress,
}: Readonly<{
  title: string;
  description: string;
  onPress: () => void;
}>) {
  return (
    <Flex p={3} backgroundColor="neutral.c20" borderRadius={8} mb={3}>
      <Text variant="subtitle" mb={1}>
        {title}
      </Text>
      <Text variant="small" color="neutral.c70" mb={3}>
        {description}
      </Text>
      <Button type="main" onPress={onPress}>
        Open {title}
      </Button>
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
});
