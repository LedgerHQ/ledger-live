import React from "react";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, Clock, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { StatusLine } from "./StatusLine";

type StatusRowProps = Readonly<{
  status: "success" | "pending" | "error" | "unknown";
  title: string;
  subtitle: string;
  value: React.ReactNode;
  isLoading: boolean;
  lineStatus?: "success" | "pending" | "error" | "unknown";
  isLast?: boolean;
}>;

export function StatusRow({
  status,
  title,
  subtitle,
  value,
  isLoading,
  lineStatus,
  isLast,
}: StatusRowProps) {
  return (
    <Box lx={{ flexDirection: "row", gap: "s12" }}>
      <Box lx={{ alignItems: "center", width: "s20" }}>
        {renderStatusIcon(status)}
        {!isLast ? <StatusLine status={lineStatus ?? status} /> : null}
      </Box>
      <Box lx={{ flex: 1, gap: "s2" }}>
        <Box lx={{ flexDirection: "row", justifyContent: "space-between", gap: "s12" }}>
          {isLoading ? (
            <Skeleton lx={{ height: "s16", width: "s112" }} />
          ) : (
            <Text typography="body2SemiBold" lx={{ color: "base", flexShrink: 1 }}>
              {title}
            </Text>
          )}
          {typeof value === "string" ? (
            <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "right" }}>
              {value}
            </Text>
          ) : (
            value
          )}
        </Box>
        {isLoading ? (
          <Skeleton lx={{ height: "s14", width: "s72" }} />
        ) : (
          <Text
            typography="body3"
            lx={{
              color: getStatusSubtitleColor(status),
            }}
          >
            {subtitle}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function renderStatusIcon(status: StatusRowProps["status"]) {
  if (status === "success") {
    return <CheckmarkCircleFill size={20} color="success" />;
  }
  if (status === "error") {
    return <Warning size={20} color="error" />;
  }
  return <Clock size={20} color="muted" />;
}

function getStatusSubtitleColor(status: StatusRowProps["status"]) {
  if (status === "success") {
    return "success";
  }
  if (status === "error") {
    return "error";
  }
  return "muted";
}
