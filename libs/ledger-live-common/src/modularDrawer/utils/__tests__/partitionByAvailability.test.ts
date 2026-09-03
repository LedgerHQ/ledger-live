import { partitionByAvailability } from "../partitionByAvailability";

type Row = { id: string; disabled?: boolean };

const isUnavailable = (row: Row) => !!row.disabled;

describe("partitionByAvailability", () => {
  it("should return empty groups when given an empty array", () => {
    expect(partitionByAvailability([], isUnavailable)).toEqual({ available: [], unavailable: [] });
  });

  it("should split rows into available and unavailable groups", () => {
    const ethereum = { id: "ethereum" };
    const bitcoin = { id: "bitcoin", disabled: true };
    const polygon = { id: "polygon" };

    expect(partitionByAvailability([ethereum, bitcoin, polygon], isUnavailable)).toEqual({
      available: [ethereum, polygon],
      unavailable: [bitcoin],
    });
  });

  it("should keep the incoming order within each group", () => {
    const rows: Row[] = [
      { id: "bitcoin", disabled: true },
      { id: "ethereum" },
      { id: "solana", disabled: true },
      { id: "polygon" },
    ];

    const { available, unavailable } = partitionByAvailability(rows, isUnavailable);

    expect(available.map(row => row.id)).toEqual(["ethereum", "polygon"]);
    expect(unavailable.map(row => row.id)).toEqual(["bitcoin", "solana"]);
  });

  it("should put every row in a single group when they all share the same availability", () => {
    const rows: Row[] = [{ id: "bitcoin" }, { id: "ethereum" }];

    expect(partitionByAvailability(rows, isUnavailable)).toEqual({
      available: rows,
      unavailable: [],
    });
    expect(partitionByAvailability(rows, () => true)).toEqual({
      available: [],
      unavailable: rows,
    });
  });
});
