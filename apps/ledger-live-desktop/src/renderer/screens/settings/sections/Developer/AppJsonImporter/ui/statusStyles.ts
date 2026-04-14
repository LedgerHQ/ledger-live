import { cva } from "class-variance-authority";

export const statusTextStyles = cva("body-3 break-words", {
  variants: {
    variant: {
      success: "text-success",
      error: "text-error",
      warning: "text-warning",
      default: "text-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
