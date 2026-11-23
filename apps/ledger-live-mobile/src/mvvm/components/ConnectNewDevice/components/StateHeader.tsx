import React from "react";
import { StyleSheet } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { StateLayoutProps } from "../types";
import { SpotAnimation } from "./SpotAnimation";

// Size of the spot in the Figma screens.
const SPOT_SIZE = 96;

type StateHeaderProps = Pick<
  StateLayoutProps,
  "animation" | "loopAnimation" | "title" | "description" | "testID"
>;

/** The animation and the texts of a state, shared by the screen and sheet layouts. */
export function StateHeader({
  animation,
  loopAnimation,
  title,
  description,
  testID,
}: Readonly<StateHeaderProps>): React.ReactNode {
  const { colorScheme } = useTheme();

  return (
    <>
      <Box lx={{ alignItems: "center", justifyContent: "center" }} style={styles.illustration}>
        <SpotAnimation
          animation={animation}
          theme={colorScheme === "dark" ? "dark" : "light"}
          spotSize={SPOT_SIZE}
          loop={loopAnimation}
          testID={testID ? `${testID}-animation` : undefined}
        />
      </Box>
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        {description ? (
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {description}
          </Text>
        ) : null}
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  // 200 comes from Figma: no size token matches it.
  illustration: { height: 200 },
});
