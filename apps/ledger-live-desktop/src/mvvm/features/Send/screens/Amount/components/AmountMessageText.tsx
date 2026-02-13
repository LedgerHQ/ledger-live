import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "LLD/utils/cn";
import type { AmountScreenMessage } from "../types";

const messageStyles = cva("text-center body-2", {
  variants: {
    type: {
      error: "text-error",
      warning: "text-warning",
      info: "text-base",
    },
  },
});

type AmountMessageTextProps = Readonly<{
  message: AmountScreenMessage | null | undefined;
}>;

export function AmountMessageText({ message }: AmountMessageTextProps) {
  if (!message) return null;

  return <p className={cn(messageStyles({ type: message.type }))}>{message.text}</p>;
}
