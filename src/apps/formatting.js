// @flow
import type { AppOp, InstalledItem } from "./types";

/** format bytes size according to given block size (defaults to 4096) */
export const formatSize = (size?: number, blockSize: number = 4096) => {
  const formatedSize =
    size && Math.ceil((Math.ceil(size / blockSize) * blockSize) / 1024);
  return formatedSize ? `${formatedSize}Kb` : "";
};

export const prettyActionPlan = (ops: AppOp[]) =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export const prettyInstalled = (items: InstalledItem[]) =>
  items
    .map(({ name, updated }) => name + (updated ? "" : " (outdated)"))
    .join(", ");
