import { z } from "zod";
import { describeCloudSyncModuleContract } from "../moduleRequirements";

const simpleModule = {
  schema: z.record(z.string(), z.string()),
  diffLocalToDistant(local: Record<string, string>, latest: Record<string, string> | null) {
    const cmp = latest ?? {};
    const same =
      Object.keys(local).length === Object.keys(cmp).length &&
      Object.entries(local).every(([k, v]) => cmp[k] === v);
    return { hasChanges: !same, nextState: local };
  },
  async resolveIncrementalUpdate(
    local: Record<string, string>,
    latest: Record<string, string> | null,
    incoming: Record<string, string> | null,
  ) {
    if (!incoming) return { hasChanges: false as const };
    if (incoming === latest) return { hasChanges: false as const };
    const same =
      Object.keys(local).length === Object.keys(incoming).length &&
      Object.entries(local).every(([k, v]) => incoming[k] === v);
    if (same) return { hasChanges: false as const };
    return { hasChanges: true as const, update: incoming };
  },
  applyUpdate(_local: Record<string, string>, update: Record<string, string>) {
    return update;
  },
};

describeCloudSyncModuleContract("simpleModule contract", simpleModule, {
  emptyLocalState: {},
  nonEmptyLocalState: { account1: "My Bitcoin", account2: "Savings" },
  matchingDistantState: { account1: "My Bitcoin", account2: "Savings" },
});
