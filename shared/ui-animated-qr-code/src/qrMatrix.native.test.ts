import { createQrMatrix, FINDER_MODULES } from "./qrMatrix";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

describe("createQrMatrix", () => {
  const matrix = createQrMatrix(ADDRESS);

  it("keeps dots out of the finders and the center clear zone", () => {
    const { moduleCount, clearStart, clearCount } = matrix;
    const inFinder = (row: number, col: number) =>
      (row < FINDER_MODULES || row >= moduleCount - FINDER_MODULES) &&
      (col < FINDER_MODULES || (row < FINDER_MODULES && col >= moduleCount - FINDER_MODULES));
    const inClearZone = (index: number) => index >= clearStart && index < clearStart + clearCount;

    expect(matrix.dots.length).toBeGreaterThan(0);
    matrix.dots.forEach(({ row, col }) => {
      expect(inFinder(row, col)).toBe(false);
      expect(inClearZone(row) && inClearZone(col)).toBe(false);
    });
  });

  it("centers the clear zone", () => {
    const { moduleCount, clearStart, clearCount } = matrix;

    expect(clearStart * 2 + clearCount).toBe(moduleCount);
  });

  it.each([
    ["a single character", "a"],
    ["an address", ADDRESS],
    ["two addresses", ADDRESS.repeat(2)],
    ["three addresses", ADDRESS.repeat(3)],
  ])("starts the clear zone on a whole module, past the finders, for %s", (_, value) => {
    const { clearStart } = createQrMatrix(value);

    expect(Number.isInteger(clearStart)).toBe(true);
    expect(clearStart).toBeGreaterThanOrEqual(FINDER_MODULES);
  });
});
