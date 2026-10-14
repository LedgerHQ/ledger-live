import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/types";
import { walkPages } from "./pages";

async function walk(pages: Record<string, Page<number>>) {
  const fetchPage = jest.fn(async (cursor: Cursor | undefined) => pages[cursor ?? "start"]!);
  const items: number[] = [];
  for await (const page of walkPages(fetchPage)) items.push(...page.items);
  return { items, cursors: fetchPage.mock.calls.map(([cursor]) => cursor) };
}

describe("walkPages", () => {
  it("follows the cursors until a missing next", async () => {
    const { items, cursors } = await walk({
      start: { items: [1, 2], next: "a" },
      a: { items: [3] },
    });
    expect(items).toEqual([1, 2, 3]);
    expect(cursors).toEqual([undefined, "a"]);
  });

  it("stops on an empty next", async () => {
    const { cursors } = await walk({ start: { items: [1], next: "" } });
    expect(cursors).toEqual([undefined]);
  });

  it("walks past an empty page that carries a next", async () => {
    const { items } = await walk({
      start: { items: [], next: "a" },
      a: { items: [1] },
    });
    expect(items).toEqual([1]);
  });

  it("stops on a next that does not advance", async () => {
    const { cursors } = await walk({
      start: { items: [1], next: "a" },
      a: { items: [2], next: "a" },
    });
    expect(cursors).toEqual([undefined, "a"]);
  });

  it("stops on a cursor cycle", async () => {
    const { items, cursors } = await walk({
      start: { items: [1], next: "a" },
      a: { items: [2], next: "b" },
      b: { items: [3], next: "a" },
    });
    expect(items).toEqual([1, 2, 3]);
    expect(cursors).toEqual([undefined, "a", "b"]);
  });
});
