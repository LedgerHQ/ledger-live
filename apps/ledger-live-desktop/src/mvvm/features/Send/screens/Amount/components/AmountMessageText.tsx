import React from "react";
import { cn } from "LLD/utils/cn";
import type { AmountScreenMessage } from "../types";

type AmountMessageTextProps = Readonly<{
  message: AmountScreenMessage | null | undefined;
}>;

export function AmountMessageText({ message }: AmountMessageTextProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "text-center body-2",
        message.type === "error" && "text-error",
        message.type === "warning" && "text-warning",
        message.type === "info" && "text-base",
      )}
    >
      {message.text}
    </p>
  );
}
