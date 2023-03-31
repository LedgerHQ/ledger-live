function summarizeAccount({
  type,
  balance,
  id,
  index,
  freshAddress,
  freshAddressPath,
  name,
  operations,
  pendingOperations,
  subAccounts,
}: object) {
  const o: object = {
    type,
    balance,
    id,
    name,
    index,
    freshAddress,
    freshAddressPath,
  };
  if (operations && typeof operations === "object" && Array.isArray(operations)) {
    o.opsL = operations.length;
  }
  if (
    pendingOperations &&
    typeof pendingOperations === "object" &&
    Array.isArray(pendingOperations)
  ) {
    o.pendingOpsL = pendingOperations.length;
  }
  if (subAccounts && typeof subAccounts === "object" && Array.isArray(subAccounts)) {
    o.subA = subAccounts.map(o => summarizeAccount(o));
  }
  return o;
}
const recSummarize = (
  obj: unknown,
  key: string | undefined | null,
  references: WeakSet<any>,
): unknown => {
  if (obj && typeof obj === "object") {
    if (references.has(obj)) return;
    references.add(obj);
  }
  switch (typeof obj) {
    case "object": {
      if (!obj) return obj;
      if (key === "appByName") return "(removed)";
      if (key === "firmware") return "(removed)";
      if (Array.isArray(obj)) {
        return obj.map(o => recSummarize(o, undefined, references));
      }
      if (
        obj.type === "Account" ||
        // AccountRaw
        ("seedIdentifier" in obj && "freshAddressPath" in obj && "operations" in obj)
      ) {
        return summarizeAccount(obj);
      }
      const copy = {};
      for (const k in obj) {
        copy[k] = recSummarize(obj[k], k, references);
      }
      return copy;
    }
    default:
      return obj;
  }
};

// minize objects that gets logged to keep the essential
export const summarize = (obj: unknown): unknown => recSummarize(obj, undefined, new WeakSet());
