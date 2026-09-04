import { buildAvailabilityRows } from "../buildAvailabilityRows";

type Row = { id: string; disabled?: boolean };

const isUnavailable = (row: Row) => !!row.disabled;

describe("buildAvailabilityRows", () => {
  it("should return no rows when given an empty array", () => {
    expect(buildAvailabilityRows([], isUnavailable)).toEqual([]);
  });

  it("should move unavailable items behind a section header", () => {
    const ethereum = { id: "ethereum" };
    const bitcoin = { id: "bitcoin", disabled: true };
    const polygon = { id: "polygon" };

    expect(buildAvailabilityRows([ethereum, bitcoin, polygon], isUnavailable)).toEqual([
      { kind: "item", item: ethereum },
      { kind: "item", item: polygon },
      { kind: "unavailableSectionHeader" },
      { kind: "item", item: bitcoin },
    ]);
  });

  it("should keep the incoming order within each group", () => {
    const rows: Row[] = [
      { id: "bitcoin", disabled: true },
      { id: "ethereum" },
      { id: "solana", disabled: true },
      { id: "polygon" },
    ];

    expect(buildAvailabilityRows(rows, isUnavailable)).toEqual([
      { kind: "item", item: rows[1] },
      { kind: "item", item: rows[3] },
      { kind: "unavailableSectionHeader" },
      { kind: "item", item: rows[0] },
      { kind: "item", item: rows[2] },
    ]);
  });

  it("should omit the section header when every item is available", () => {
    const bitcoin = { id: "bitcoin" };
    const ethereum = { id: "ethereum" };

    expect(buildAvailabilityRows([bitcoin, ethereum], isUnavailable)).toEqual([
      { kind: "item", item: bitcoin },
      { kind: "item", item: ethereum },
    ]);
  });

  it("should lead with the section header when no item is available", () => {
    const bitcoin = { id: "bitcoin" };
    const ethereum = { id: "ethereum" };

    expect(buildAvailabilityRows([bitcoin, ethereum], () => true)).toEqual([
      { kind: "unavailableSectionHeader" },
      { kind: "item", item: bitcoin },
      { kind: "item", item: ethereum },
    ]);
  });
});
