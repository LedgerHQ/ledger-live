import { composeAvailability } from "./composeAvailability.internals";

describe("composeAvailability", () => {
  it("should return the first unavailable check", () => {
    expect(
      composeAvailability(
        { status: "unavailable", reason: "geoBlocked" },
        { status: "unavailable", reason: "serviceUnavailable" },
      ),
    ).toEqual({ status: "unavailable", reason: "geoBlocked" });
  });

  it("should prefer unavailable over pending", () => {
    expect(
      composeAvailability(
        { status: "pending" },
        { status: "unavailable", reason: "serviceUnavailable" },
      ),
    ).toMatchObject({ status: "unavailable", reason: "serviceUnavailable" });
  });

  it("should return pending when no check has failed yet", () => {
    expect(composeAvailability({ status: "available" }, { status: "pending" })).toEqual({
      status: "pending",
    });
  });

  it("should return available when every check is available", () => {
    expect(composeAvailability({ status: "available" }, { status: "available" })).toEqual({
      status: "available",
    });
  });
});
