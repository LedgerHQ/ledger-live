import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { StateLayoutProps } from "../types";
import { StateHeader } from "./StateHeader";

/** Full-screen layout: the content scrolls under the texts and the footer stays at the bottom. */
export function StateLayout({
  children,
  footer,
  testID,
  ...headerProps
}: Readonly<StateLayoutProps>): React.ReactNode {
  return (
    <Box lx={{ flex: 1, gap: "s24" }} testID={testID}>
      <StateHeader {...headerProps} testID={testID} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        alwaysBounceVertical={false}
      >
        {children}
      </ScrollView>
      {footer ? <Box lx={{ paddingBottom: "s24" }}>{footer}</Box> : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  contentContainer: { paddingBottom: 16 },
});
