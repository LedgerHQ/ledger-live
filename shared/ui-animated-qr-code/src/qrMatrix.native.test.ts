import { createQrMatrix, FINDER_MODULES, getModuleCenter } from "./qrMatrix";

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

describe("createQrMatrix", () => {
  const matrix = createQrMatrix(ADDRESS);

  it("places the three finders in the top-left, top-right and bottom-left corners", () => {
    const edge = matrix.moduleCount - FINDER_MODULES;

    expect(matrix.finders).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: edge },
      { row: edge, col: 0 },
    ]);
  });

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
});

describe("getModuleCenter", () => {
  it("returns the module center as a fraction of the side", () => {
    expect(getModuleCenter(0, 10)).toBe(0.05);
    expect(getModuleCenter(9, 10)).toBe(0.95);
  });
});
