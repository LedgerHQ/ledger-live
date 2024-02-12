import type { AppOp, InstalledItem } from "./types";

/**
 * Formats a byte value into its correct size in kb or mb unit taking into
 * the device block size. It accepts a formatting function to be able to
 * customize the rounding if needed.
 **/
export const formatSize = (value = 0, blockSize: number, floor = false): [string, string] => {
  const units = ["bytes", "kbUnit", "mbUnit"];
  const k = 1024; // 1kb unit

  const bytes = Math.ceil(value / blockSize) * blockSize;
  const i = Math.floor(Math.log(bytes) / Math.log(k)) || 1; // Nb Byte units were removed from UI
  const rawSize = bytes / Math.pow(k, i);
  const roundingPrecision = rawSize < 1 ? 1 : i > 1 ? 2 : 0;

  const divider = Math.pow(10, roundingPrecision);
  const toFormat = rawSize * divider;
  let formattedSize = floor ? Math.floor(toFormat) : Math.ceil(toFormat);
  formattedSize /= divider;

  return [formattedSize.toFixed(roundingPrecision), units[i]];
};

export const prettyActionPlan = (ops: AppOp[]): string =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export const prettyInstalled = (items: InstalledItem[]): string =>
  items.map(({ name, updated }) => name + (updated ? "" : " (outdated)")).join(", ");
