export type PersistenceFailure = {
  key: string;
  version: number;
  operation: "read" | "decode" | "newer" | "write";
  reason: string;
  entry?: number;
};

export type ReportPersistenceFailure = (failure: PersistenceFailure) => void;

/** 1 line for the logs. It has no stored value: `reason` never holds one. */
export const describePersistenceFailure = ({
  key,
  version,
  operation,
  reason,
  entry,
}: PersistenceFailure): string => {
  const where = entry === undefined ? "" : ` entry ${entry}`;
  if (operation === "newer") {
    return `Persistence found a newer version of record "${key}" v${version}${where}: ${reason}`;
  }
  return `Persistence ${operation} failed for record "${key}" v${version}${where}: ${reason}`;
};
