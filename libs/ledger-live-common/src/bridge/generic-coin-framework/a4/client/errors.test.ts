import { LedgerAPI4xx, LedgerAPI5xx, NetworkDown } from "@ledgerhq/live-network";
import { toA4HttpError } from "./errors";

describe("toA4HttpError", () => {
  it.each([
    [
      new LedgerAPI4xx("not found", { status: 404 }),
      { name: "A4HttpError", status: 404, message: "not found" },
    ],
    [
      new LedgerAPI5xx("server error", { status: 500 }),
      { name: "A4HttpError", status: 500, message: "server error" },
    ],
    [
      new NetworkDown("network down"),
      { name: "A4HttpError", status: undefined, message: "network down" },
    ],
    [new Error("oops"), { name: "A4HttpError", status: undefined, message: "oops" }],
    ["unexpected", { name: "A4HttpError", status: undefined, message: "A4 request failed" }],
  ])("returns A4HttpError for %s", (input, expected) => {
    expect(toA4HttpError(input)).toEqual(expect.objectContaining(expected));
  });
});
