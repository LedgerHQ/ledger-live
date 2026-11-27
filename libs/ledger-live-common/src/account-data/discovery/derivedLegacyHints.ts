import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";

export type DerivedLegacyHints = {
  readonly seedIdentifier?: string;
  readonly publicKey?: string;
  readonly address?: string;
};

const MAX_HINTS = 2048;
const hintsByDescriptor = new Map<string, DerivedLegacyHints>();

function isDescriptor(value: unknown): value is AccountDescriptor {
  return (
    typeof value === "object" &&
    value !== null &&
    "purpose" in value &&
    "network" in value &&
    "key" in value
  );
}

/** Keeps device-derived legacy fields (seedIdentifier, account publicKey) aside for placeholderAccount. */
export function recordDerivedLegacyHints(
  descriptor: AccountDescriptor,
  hints: DerivedLegacyHints,
): void {
  if (!isDescriptor(descriptor)) return;
  if (
    hints.seedIdentifier === undefined &&
    hints.publicKey === undefined &&
    hints.address === undefined
  ) {
    return;
  }
  const key = accountDescriptorKey(descriptor);
  const existing = hintsByDescriptor.get(key);
  hintsByDescriptor.delete(key);
  hintsByDescriptor.set(key, {
    seedIdentifier: hints.seedIdentifier ?? existing?.seedIdentifier,
    publicKey: hints.publicKey || existing?.publicKey,
    address: hints.address || existing?.address,
  });
  if (hintsByDescriptor.size > MAX_HINTS) {
    const oldest = hintsByDescriptor.keys().next().value;
    if (oldest !== undefined) hintsByDescriptor.delete(oldest);
  }
}

export function readDerivedLegacyHints(
  descriptor: AccountDescriptor,
): DerivedLegacyHints | undefined {
  if (!isDescriptor(descriptor)) return undefined;
  return hintsByDescriptor.get(accountDescriptorKey(descriptor));
}

export function clearDerivedLegacyHints(): void {
  hintsByDescriptor.clear();
}
