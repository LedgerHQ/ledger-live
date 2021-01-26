// @flow
import type { AppOp, InstalledItem } from "./types";

export const formatSize = (size?: number, blockSize: number) => {
  const formatedSize =
    size && Math.ceil((Math.ceil(size / blockSize) * blockSize) / 1024);
  return formatedSize ? `${formatedSize}Kb` : "";
};

export const prettyActionPlan = (ops: AppOp[]) =>
  ops.map((op) => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export const prettyInstalled = (items: InstalledItem[]) =>
  items
    .map(({ name, updated }) => name + (updated ? "" : " (outdated)"))
    .join(", ");
