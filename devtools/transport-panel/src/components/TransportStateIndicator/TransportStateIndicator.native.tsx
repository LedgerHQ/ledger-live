import type { MessageMap, TransportState, ConnectionStatus, Role } from "@devtools/transport";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ComponentProps } from "react";

export interface TransportStateIndicatorProps<M extends MessageMap> {
  readonly transportState: TransportState<M>;
  readonly role: Role;
}

type BgToken = NonNullable<ComponentProps<typeof Box>["lx"]>["backgroundColor"];
type TextToken = NonNullable<ComponentProps<typeof Text>["lx"]>["color"];

type StatusColors = { bg: BgToken; dot: BgToken; text: TextToken };

const STATUS_COLOR: Record<ConnectionStatus, StatusColors> = {
  idle: { bg: "muted", dot: "mutedStrong", text: "muted" },
  connecting: { bg: "warning", dot: "warningStrong", text: "warning" },
  open: { bg: "success", dot: "successStrong", text: "success" },
  closed: { bg: "disabled", dot: "disabledStrong", text: "disabled" },
  error: { bg: "error", dot: "errorStrong", text: "error" },
};

export function TransportStateIndicator<M extends MessageMap>({
  transportState,
  role,
}: TransportStateIndicatorProps<M>) {
  const { bg, dot, text } = STATUS_COLOR[transportState.status];
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s8",
        justifyContent: "center",
      }}
    >
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: "full",
          paddingHorizontal: "s8",
          paddingVertical: "s2",
          gap: "s8",
          backgroundColor: bg,
        }}
      >
        <Box
          lx={{ borderRadius: "full", backgroundColor: dot }}
          style={{ width: 10, height: 10 }}
        />
        <Text typography="body3" lx={{ color: text }}>
          {transportState.status}
        </Text>
      </Box>
      <Text typography="body3" lx={{ color: "muted" }}>
        WS
      </Text>
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: "full",
          paddingHorizontal: "s8",
          paddingVertical: "s2",
          gap: "s8",
        }}
      >
        <Text typography="body3" lx={{ color: "muted" }}>
          {role}
        </Text>
      </Box>
    </Box>
  );
}
