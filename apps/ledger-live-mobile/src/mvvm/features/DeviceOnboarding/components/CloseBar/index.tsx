import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExperimental } from "~/experimental";

const HEADER_CONTENT_HEIGHT = 44;

type DeviceOnboardingCloseBarProps = Readonly<{
  label: string;
  testID: string;
  onPress?: () => void;
}>;

export function DeviceOnboardingCloseBar({
  label,
  testID,
  onPress,
}: DeviceOnboardingCloseBarProps) {
  const { top } = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();
  const paddingTop = hasExperimentalHeader ? 0 : top;

  return (
    <View style={{ paddingTop }}>
      <View style={styles.bar}>
        {onPress ? (
          <IconButton
            appearance="no-background"
            size="md"
            icon={Close}
            accessibilityLabel={label}
            testID={testID}
            onPress={onPress}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: HEADER_CONTENT_HEIGHT,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 16,
  },
});
