import React, { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { StatusGradient, type StatusGradientTone } from "LLM/components/StatusGradient";

const SPOT_APPEARANCE_BY_TONE = { success: "check", error: "error", info: "info" } as const;

export type ConfirmationStatusLayoutProps = Readonly<{
  tone: StatusGradientTone;
  title?: ReactNode;
  description?: ReactNode;
  belowDescription?: ReactNode;
  actions: ReactNode;
  testID?: string;
}>;

/**
 * Full-screen status layout shared by the success and error confirmation screens:
 * a top status glow, a centered spot with title/description, and bottom actions.
 */
export function ConfirmationStatusLayout({
  tone,
  title,
  description,
  belowDescription,
  actions,
  testID,
}: ConfirmationStatusLayoutProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      gradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]} testID={testID}>
      <View pointerEvents="none" style={styles.gradient}>
        <StatusGradient tone={tone} testID={testID ? `${testID}-gradient` : undefined} />
      </View>

      <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingVertical: "s24" }}>
        <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: "s24" }}>
          <Spot appearance={SPOT_APPEARANCE_BY_TONE[tone]} size={72} />
          {title || description || belowDescription ? (
            <Box lx={{ gap: "s8", alignItems: "center" }}>
              {title ? (
                <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
                  {title}
                </Text>
              ) : null}
              {description ? (
                <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                  {description}
                </Text>
              ) : null}
              {belowDescription ? (
                <Box lx={{ marginTop: "s16", alignItems: "center" }}>{belowDescription}</Box>
              ) : null}
            </Box>
          ) : null}
        </Box>

        <Box lx={{ gap: "s16" }}>{actions}</Box>
      </Box>
    </SafeAreaView>
  );
}
