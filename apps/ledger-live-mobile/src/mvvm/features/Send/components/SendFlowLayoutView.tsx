import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

import type { SendFlowLayoutProps } from "./types";
import { SendHeader } from "./SendHeader";

export function SendFlowLayoutView({ headerRight, headerContent, children }: SendFlowLayoutProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      headerContent: {
        marginTop: theme.spacings.s12,
        paddingHorizontal: theme.spacings.s16,
      },
      bodyContent: {
        paddingVertical: theme.spacings.s24,
        paddingHorizontal: theme.spacings.s16,
        flex: 1,
      },
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <SendHeader headerRight={headerRight} />
      {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
      <View style={styles.bodyContent}>{children}</View>
    </SafeAreaView>
  );
}
