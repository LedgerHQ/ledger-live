// @flow
import type { AppOp, InstalledItem } from "./types";

export const formatSize = (size: number) =>
  !size ? "" : Math.round(size / 1024) + "Kb";

export const prettyActionPlan = (ops: AppOp[]) =>
  ops.map(op => (op.type === "install" ? "+" : "-") + op.name).join(", ");

export const prettyInstalled = (items: InstalledItem[]) =>
  items
    .map(({ name, updated }) => name + (updated ? "" : " (outdated)"))
    .join(", ");
