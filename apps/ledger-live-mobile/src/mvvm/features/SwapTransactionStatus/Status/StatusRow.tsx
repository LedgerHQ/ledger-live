import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, Clock, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { StatusLine } from "./StatusLine";

type StatusRowProps = {
  status: "success" | "pending" | "error" | "unknown";
  title: string;
  subtitle: string;
  value: React.ReactNode;
  isLast?: boolean;
};

export function StatusRow({ status, title, subtitle, value, isLast }: StatusRowProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s12" }}>
      <Box lx={{ alignItems: "center", width: "s20" }}>
        {status === "success" ? (
          <CheckmarkCircleFill size={20} color="success" />
        ) : status === "error" ? (
          <Warning size={20} color="error" />
        ) : (
          <Clock size={20} color="muted" />
        )}
        {!isLast ? <StatusLine status={status} /> : null}
      </Box>
      <Box lx={{ flex: 1, gap: "s2" }}>
        <Box lx={{ flexDirection: "row", justifyContent: "space-between", gap: "s12" }}>
          <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
            {title}
          </Text>
          {typeof value === "string" ? (
            <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "right" }}>
              {value}
            </Text>
          ) : (
            value
          )}
        </Box>
        <Text
          typography="body3"
          lx={{
            color: status === "success" ? "success" : status === "error" ? "error" : "muted",
          }}
        >
          {subtitle}
        </Text>
      </Box>
    </Box>
  );
}
