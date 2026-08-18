export function parseLargeMoverLedgerIds(ledgerIds: string): string[] {
  const ids = ledgerIds
    .split(",")
    .map(id => id.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(ids)];
}
