import { Account, SubAccount } from "@ledgerhq/types-live";

function summarizeAccount(argument: Account | SubAccount) {
  const { type, balance, id, operations, pendingOperations } = argument;

  let index, freshAddress, freshAddressPath, name, subAccounts;

  if (argument.type === "Account") {
    index = argument.index;
    freshAddress = argument.freshAddress;
    freshAddressPath = argument.freshAddressPath;
    name = argument.name;
    subAccounts = argument.subAccounts;
  }

  const o = {
    type,
    balance,
    id,
    name,
    index,
    freshAddress,
    freshAddressPath,
    opsL: undefined as number | undefined,
    pendingOpsL: undefined as number | undefined,
    subA: undefined as unknown[] | undefined,
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
  obj: object | undefined,
  key: string | undefined | null,
  references: WeakSet<object>,
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
        (obj as { type: string }).type === "Account" ||
        // AccountRaw
        ("seedIdentifier" in obj && "freshAddressPath" in obj && "operations" in obj)
      ) {
        return summarizeAccount(obj as Account);
      }
      const copy = {};
      for (const k in obj) {
        // @ts-expect-error it is fine to access a key
        copy[k] = recSummarize(obj[k], k, references);
      }
      return copy;
    }
    default:
      return obj;
  }
};

// minimize objects that gets logged to keep the essential
export const summarize = (obj: object): unknown => recSummarize(obj, undefined, new WeakSet());
