// Families whose backend sits behind Ledger's compliance layer: a request failing for any other
// family says nothing about the user's region.
const REGION_RESTRICTED_FAMILIES = new Set(["hypercore"]);

// A blocked region gets a redirect to the compliance page instead of the backend. axios follows it
// and replays the request there, where a POST answers 405.
const COMPLIANCE_STATUS = 405;

export function isRegionRestrictedFailure(error: unknown, family: string): boolean {
  if (!REGION_RESTRICTED_FAMILIES.has(family)) return false;

  const status = (error as { status?: unknown })?.status;
  return status === COMPLIANCE_STATUS;
}
