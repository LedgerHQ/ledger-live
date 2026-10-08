import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { StateAnimation } from "../animations";
import { SpotAnimation } from "./SpotAnimation";

// Size of the spot in the Figma screens.
const SPOT_SIZE = 96;

type StateLayoutProps = {
  animation: StateAnimation;
  loopAnimation: boolean;
  title: string;
  description?: string;
  /** Scrolls under the texts, for example the device list. */
  children?: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
};

/** Layout shared by the Discovering, Connecting and Connected views. */
export function StateLayout({
  animation,
  loopAnimation,
  title,
  description,
  children,
  footer,
  testID,
}: Readonly<StateLayoutProps>): React.ReactNode {
  const { colorScheme } = useTheme();

  return (
    <Box lx={{ flex: 1, gap: "s24" }} testID={testID}>
      <Box lx={{ alignItems: "center", justifyContent: "center" }} style={styles.illustration}>
        <SpotAnimation
          animation={animation}
          theme={colorScheme === "dark" ? "dark" : "light"}
          spotSize={SPOT_SIZE}
          loop={loopAnimation}
          testID={testID ? `${testID}-animation` : undefined}
        />
      </Box>
      <Box lx={{ alignItems: "center", gap: "s8", paddingHorizontal: "s16" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        {description ? (
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        ) : null}
      </Box>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {children}
      </ScrollView>
      {footer ? <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>{footer}</Box> : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  // 200 comes from Figma: no size token matches it.
  illustration: { height: 200 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 16 },
});
