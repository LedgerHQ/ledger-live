import React from "react";
import { Pressable } from "react-native";
import { Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardShape } from "./qaConsole";
import { ShapeTag } from "./shared";

export type TagAppearance = "success" | "error" | "gray";
export function StatusRow({
  title,
  subtitle,
  shape,
  isLocal,
  statusLabel,
  statusAppearance,
  onPress,
  testID,
}: Readonly<{
  title: string;
  subtitle?: string;
  shape?: CardShape;
  isLocal?: boolean;
  statusLabel?: string;
  statusAppearance?: TagAppearance;
  onPress: () => void;
  testID?: string;
}>) {
  return (
    <Pressable onPress={onPress} testID={testID}>
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: "s24",
          paddingVertical: "s12",
          gap: "s8",
        }}
      >
        <Box lx={{ flex: 1, gap: "s4" }}>
          {shape || isLocal ? (
            <Box lx={{ alignItems: "flex-start", flexDirection: "row", gap: "s8" }}>
              <ShapeTag shape={shape} />
              {isLocal ? <Tag label="Local" size="sm" appearance="gray" /> : null}
            </Box>
          ) : null}
          <Text typography="body1SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
          {subtitle ? (
            <Text typography="body2" lx={{ color: "muted" }}>
              {subtitle}
            </Text>
          ) : null}
        </Box>
        {statusLabel && statusAppearance ? (
          <Tag label={statusLabel} size="sm" appearance={statusAppearance} />
        ) : null}
        <ChevronRight size={16} color="muted" />
      </Box>
    </Pressable>
  );
}
