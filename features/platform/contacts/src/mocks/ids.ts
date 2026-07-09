export function createUniqueMockId(
  prefix: "address" | "contact",
  value: string,
  existingIds: Iterable<string>,
): string {
  const baseId = `${prefix}-${slugify(value)}`;
  const knownIds = new Set(existingIds);
  let candidateId = baseId;
  let suffix = 2;

  while (knownIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}
