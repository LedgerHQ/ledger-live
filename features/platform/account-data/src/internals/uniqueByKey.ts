import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";

/** The descriptors by key, the first of each account only, in the order given. */
export function uniqueByKey(
  descriptors: readonly AccountDescriptor[],
): Map<string, AccountDescriptor> {
  const byKey = new Map<string, AccountDescriptor>();
  for (const descriptor of descriptors) {
    const key = accountDescriptorKey(descriptor);
    if (!byKey.has(key)) byKey.set(key, descriptor);
  }
  return byKey;
}
