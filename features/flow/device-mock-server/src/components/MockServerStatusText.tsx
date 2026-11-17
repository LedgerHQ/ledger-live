import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import type { MockServerStatus } from "../useMockServerStatus";

const STATUS_LABELS: Record<MockServerStatus, string> = {
  checking: "Checking…",
  connected: "Connected",
  unreachable: "Server unreachable",
  sessionExpired: "Session expired",
};

const STATUS_COLORS: Record<MockServerStatus, "muted" | "success" | "error" | "warning"> = {
  checking: "muted",
  connected: "success",
  unreachable: "error",
  sessionExpired: "warning",
};

export function MockServerStatusText({ status }: Readonly<{ status: MockServerStatus }>) {
  return (
    <Text typography="body2" lx={{ color: STATUS_COLORS[status] }}>
      {STATUS_LABELS[status]}
    </Text>
  );
}
