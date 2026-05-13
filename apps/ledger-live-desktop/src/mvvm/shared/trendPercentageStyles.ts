import { cva } from "class-variance-authority";

const baseStyles = {
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
} as const;

/** Shared trend coloring for inline percentage text (portfolio, asset detail, etc.). */
export const trendPercentageBody2Styles = cva("body-2", baseStyles);

export const trendPercentageBody3Styles = cva("body-3", baseStyles);
