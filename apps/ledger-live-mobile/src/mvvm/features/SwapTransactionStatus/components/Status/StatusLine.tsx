import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type StatusLineProps = {
  status: "success" | "pending" | "error" | "unknown";
};

export function StatusLine({ status }: StatusLineProps) {
  return (
    <Box
      lx={{
        backgroundColor:
          status === "success" ? "successStrong" : status === "error" ? "errorStrong" : "muted",
        borderRadius: "full",
        height: "s32",
        width: "s4",
        marginTop: "s4",
      }}
    />
  );
}
