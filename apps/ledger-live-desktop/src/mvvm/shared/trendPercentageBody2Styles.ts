import { cva } from "class-variance-authority";

/** Shared body-2 trend coloring for inline percentage text (portfolio, asset detail, etc.). */
export const trendPercentageBody2Styles = cva("body-2", {
  variants: {
    variant: {
      positive: "text-success",
      negative: "text-error",
      neutral: "text-muted",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});
