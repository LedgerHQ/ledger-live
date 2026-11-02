/** The operation count asked in the tool for each account it generated; none means the seeded default. */
const counts = new Map<string, number>();

export const operationCountOf = (accountUUID: string): number | undefined =>
  counts.get(accountUUID);

/** `undefined` drops the override, back to the seeded default. */
export function setOperationCount(accountUUIDs: readonly string[], count: number | undefined) {
  for (const accountUUID of accountUUIDs) {
    if (count === undefined) counts.delete(accountUUID);
    else counts.set(accountUUID, count);
  }
}
