import { cva } from "class-variance-authority";

export const statusTextStyles = cva("body-3 break-words text-center", {
  variants: {
    variant: {
      success: "text-success",
      error: "text-error",
      default: "text-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
