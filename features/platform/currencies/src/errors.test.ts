import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "./errors";

describe("errors", () => {
  it.each([
    [new NetworkDown(), "NetworkDown"],
    [new LedgerAPI4xx(), "LedgerAPI4xx"],
    [new LedgerAPI5xx(), "LedgerAPI5xx"],
  ])("%p extends Error and keeps the stable name %s", (error, name) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
  });
});
