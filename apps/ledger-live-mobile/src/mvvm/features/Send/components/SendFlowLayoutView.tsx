import React from "react";
import { View, ScrollView } from "react-native";
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
        padding: theme.spacings.s16,
        flexGrow: 1,
      },
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <SendHeader headerRight={headerRight} />
      {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
      <ScrollView contentContainerStyle={styles.bodyContent}>{children}</ScrollView>
    </View>
  );
}
