import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type StatusLineProps = Readonly<{
  status: "success" | "pending" | "error" | "unknown";
}>;

export function StatusLine({ status }: StatusLineProps) {
  return (
    <Box
      lx={{
        backgroundColor: getStatusLineBackgroundColor(status),
        borderRadius: "full",
        height: "s32",
        width: "s4",
        marginTop: "s4",
      }}
    />
  );
}

function getStatusLineBackgroundColor(status: StatusLineProps["status"]) {
  if (status === "success") {
    return "successStrong";
  }
  if (status === "error") {
    return "errorStrong";
  }
  return "muted";
}
