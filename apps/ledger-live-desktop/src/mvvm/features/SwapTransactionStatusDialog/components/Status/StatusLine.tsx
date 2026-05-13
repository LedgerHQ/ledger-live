import React from "react";
import { cn } from "LLD/utils/cn";

type StatusLineProps = Readonly<{
  status: "success" | "pending" | "error" | "unknown";
}>;

export function StatusLine({ status }: StatusLineProps) {
  return (
    <div
      className={cn("bg-muted h-24 w-4 rounded-full", {
        "bg-success-strong": status === "success",
        "bg-error-strong": status === "error",
      })}
    />
  );
}
