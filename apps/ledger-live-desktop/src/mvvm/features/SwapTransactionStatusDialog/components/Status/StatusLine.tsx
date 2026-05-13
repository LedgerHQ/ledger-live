import React from "react";
import { cn } from "LLD/utils/cn";

type StatusLineProps = Readonly<{
  status: "success" | "pending" | "error" | "unknown";
}>;

export function StatusLine({ status }: StatusLineProps) {
  return (
    <div
      className={cn("bg-muted-strong h-full w-4 mt-4 rounded-full", {
        "bg-success-strong": status === "success",
        "bg-error-strong": status === "error",
      })}
    />
  );
}
