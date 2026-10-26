import { readOrCreatePortfolioId } from "./portfolioId";

const KEY = "portfolio-id";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>(initial ? [[KEY, initial]] : []);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("readOrCreatePortfolioId", () => {
  it("should reuse the stored portfolio id", () => {
    expect(readOrCreatePortfolioId(memoryStorage("ledger-live-existing"), KEY)).toBe(
      "ledger-live-existing",
    );
  });

  it("should store a new portfolio id when none exists", () => {
    const storage = memoryStorage();
    const id = readOrCreatePortfolioId(storage, KEY);
    expect(id).toMatch(/^ledger-live-/);
    expect(storage.getItem(KEY)).toBe(id);
  });

  it("should still give an id when storage is unavailable", () => {
    const failing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => undefined,
    };
    expect(readOrCreatePortfolioId(failing, KEY)).toMatch(/^ledger-live-/);
    expect(readOrCreatePortfolioId(undefined, KEY)).toMatch(/^ledger-live-/);
  });
});
