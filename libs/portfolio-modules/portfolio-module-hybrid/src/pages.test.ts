import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { PageView, UpdateView } from "@ledgerhq/portfolio-module-framework";
import { readSidePages, sideQuery, sortByTime } from "./pages";
import { decodeCursors } from "./token";
import type { Side } from "./types";

const BOTH: Side[] = ["local", "remote"];
const notFound = () => new PortfolioApiError("NOT_FOUND", "missing");

const reader = (pages: Partial<Record<Side, PageView<string> | Error>>) =>
  jest.fn(async (side: Side, _token: string | undefined) => {
    const page = pages[side];
    if (page instanceof Error) throw page;
    return page ?? {};
  });

describe("readSidePages", () => {
  it("reads the first page of every side and concatenates them local first", async () => {
    const read = reader({ local: { items: ["l1"] }, remote: { items: ["r1"] } });

    await expect(readSidePages("p1", BOTH, {}, read)).resolves.toEqual({ items: ["l1", "r1"] });
    expect(read).toHaveBeenCalledWith("local", undefined);
    expect(read).toHaveBeenCalledWith("remote", undefined);
  });

  it("encodes the token of every side still going, null for an exhausted one", async () => {
    const read = reader({ local: { items: ["l1"] }, remote: { items: ["r1"], nextToken: "r2" } });

    const page = await readSidePages("p1", BOTH, {}, read);

    expect(decodeCursors(page.nextToken!)).toEqual({ local: null, remote: "r2" });
  });

  it("continues each side from its own token and skips an exhausted side", async () => {
    const read = reader({ remote: { items: ["r2"], nextToken: "r3" } });

    const page = await readSidePages("p1", BOTH, { local: null, remote: "r2" }, read);

    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith("remote", "r2");
    expect(page.items).toEqual(["r2"]);
    expect(decodeCursors(page.nextToken!)).toEqual({ local: null, remote: "r3" });
  });

  it("treats an empty next token as exhausted", async () => {
    const read = reader({ local: { items: ["l1"], nextToken: "" } });

    await expect(readSidePages("p1", ["local"], {}, read)).resolves.toEqual({ items: ["l1"] });
  });

  it("reads a page without items as empty", async () => {
    const read = reader({ local: {}, remote: { items: ["r1"] } });

    await expect(readSidePages("p1", BOTH, {}, read)).resolves.toEqual({ items: ["r1"] });
  });

  it("encodes only the sides it reads", async () => {
    const read = reader({ remote: { items: ["r1"], nextToken: "r2" } });

    const page = await readSidePages("p1", ["remote"], {}, read);

    expect(read).not.toHaveBeenCalledWith("local", expect.anything());
    expect(decodeCursors(page.nextToken!)).toEqual({ remote: "r2" });
  });

  it("answers an empty last page when no side is left", async () => {
    const read = reader({});

    await expect(readSidePages("p1", [], {}, read)).resolves.toEqual({ items: [] });
    await expect(readSidePages("p1", BOTH, { local: null, remote: null }, read)).resolves.toEqual({
      items: [],
    });
    expect(read).not.toHaveBeenCalled();
  });

  it("treats a side answering NOT_FOUND as exhausted", async () => {
    const read = reader({ local: notFound(), remote: { items: ["r1"], nextToken: "r2" } });

    const page = await readSidePages("p1", BOTH, {}, read);

    expect(page.items).toEqual(["r1"]);
    expect(decodeCursors(page.nextToken!)).toEqual({ local: null, remote: "r2" });
  });

  it("answers NOT_FOUND when every side read answers it", async () => {
    const read = reader({ local: notFound(), remote: notFound() });

    await expect(readSidePages("p1", BOTH, {}, read)).rejects.toMatchObject({
      type: "NOT_FOUND",
      message: "Portfolio p1 not found",
    });
  });

  it("propagates any other error", async () => {
    const read = reader({ local: { items: [] }, remote: new Error("down") });

    await expect(readSidePages("p1", BOTH, {}, read)).rejects.toThrow("down");
  });
});

describe("sideQuery", () => {
  it("replaces the hybrid token with the side's own", () => {
    expect(sideQuery({ size: 10, network: "bitcoin", token: "hybrid" }, "side")).toEqual({
      size: 10,
      network: "bitcoin",
      token: "side",
    });
  });

  it("drops the hybrid token on a side's first page", () => {
    expect(sideQuery({ size: 10, token: "hybrid" }, undefined)).toEqual({ size: 10 });
  });
});

describe("sortByTime", () => {
  const update = (time: string): UpdateView => ({
    network: "bitcoin",
    accountId: "acc",
    operation: {},
    time,
    txHash: time,
  });
  const times = (updates: UpdateView[]) => updates.map(({ time }) => time);
  const merged = () => [
    update("2026-01-02T00:00:00Z"),
    update("2026-01-03T00:00:00.000Z"),
    update("2026-01-01T00:00:00Z"),
  ];

  it("sorts the most recent first by default", () => {
    expect(times(sortByTime(merged()))).toEqual([
      "2026-01-03T00:00:00.000Z",
      "2026-01-02T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ]);
  });

  it("sorts the oldest first in ASC order", () => {
    expect(times(sortByTime(merged(), "ASC"))).toEqual([
      "2026-01-01T00:00:00Z",
      "2026-01-02T00:00:00Z",
      "2026-01-03T00:00:00.000Z",
    ]);
  });
});
