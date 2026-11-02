import { birthdayTimestamp } from "./birthday";

describe("birthdayTimestamp", () => {
  it("reads a date as UTC midnight, in seconds", () => {
    expect(birthdayTimestamp("2026-07-28")).toBe(1785196800);
  });

  it("drops the sub-second part of a full timestamp", () => {
    expect(birthdayTimestamp("2026-07-28T00:00:00.999Z")).toBe(1785196800);
  });
});
