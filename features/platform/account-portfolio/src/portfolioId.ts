type IdStorage = Pick<Storage, "getItem" | "setItem">;

const newPortfolioId = () => `ledger-live-${crypto.randomUUID()}`;

/** The portfolio id kept under `key`; a new one, stored, when there is none. */
export function readOrCreatePortfolioId(storage: IdStorage | undefined, key: string): string {
  try {
    const existing = storage?.getItem(key);
    if (existing) return existing;
    const id = newPortfolioId();
    storage?.setItem(key, id);
    return id;
  } catch {
    return newPortfolioId();
  }
}
