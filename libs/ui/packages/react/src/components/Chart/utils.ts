/**
 * Returns the value fixed to 1 decimals when needed with his associated unit (e.g. "1.5K" or "1.5M")
 * @param value - Value displayed on the y-axis as a tick
 * @example
 * ```
 * valueFormatter(1500) // "1.5K"
 * valueFormatter(1567) // "1.5K"
 * valueFormatter(1567657) // "1.5M"
 * valueFormatter(156) // "156"
 * ```
 */
export const valueFormatter = (value: string | number): string => {
  const breakpoints = [
    { value: 1e6, unit: "M" },
    { value: 1e3, unit: "K" },
    { value: 1, unit: "" },
  ];

  const item = breakpoints.find(item => value >= item.value);
  const formatedValue = typeof value === "number" ? value : parseFloat(value);
  return item ? `${(formatedValue / item.value).toFixed(1).replace(".0", "")} ${item.unit}` : "0";
};

// set default font configuration for the chart - I used ll-text_subTitle class from our theme
export const fontConfig: {
  family: string;
  size: number;
  weight: string;
  lineHeight: number;
  style: "normal" | "italic";
} = {
  family: "Inter, Arial",
  size: 11,
  weight: "600",
  lineHeight: 1.21,
  style: "normal",
};
