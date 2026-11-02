import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { cutPage, parseCursor } from "../cursor";

describe("cursor", () => {
  describe("parseCursor", () => {
    it("reads the second the next page starts at", () => {
      expect(parseCursor("1725542832")).toBe(1725542832);
    });

    it("reads an absent cursor as the start of the walk", () => {
      expect(parseCursor(undefined)).toBeUndefined();
      expect(parseCursor("")).toBeUndefined();
    });

    it.each(["1725542832:1:0", "a", "-1", "1.5", "9".repeat(20)])("rejects %s", cursor => {
      expect(() => parseCursor(cursor)).toThrow(InvalidParameterError);
    });
  });

  describe("cutPage", () => {
    it("emits everything and ends the walk when no source filled its page", () => {
      expect(
        cutPage("desc", [
          { utimes: [30, 20], full: false },
          { utimes: [25], full: false },
        ]),
      ).toEqual({ consumed: [2, 1], next: undefined });
    });

    it("ends the walk on two empty sources", () => {
      expect(
        cutPage("desc", [
          { utimes: [], full: false },
          { utimes: [], full: false },
        ]),
      ).toEqual({ consumed: [0, 0], next: undefined });
    });

    it("stops a descending page before the latest last second among full sources", () => {
      expect(
        cutPage("desc", [
          { utimes: [30, 20, 15, 10], full: true },
          { utimes: [25, 20], full: true },
        ]),
      ).toEqual({ consumed: [1, 1], next: 20 });
    });

    it("stops an ascending page before the earliest last second among full sources", () => {
      expect(
        cutPage("asc", [
          { utimes: [10, 20, 30], full: true },
          { utimes: [15, 25], full: false },
        ]),
      ).toEqual({ consumed: [2, 2], next: 30 });
    });

    it("leaves a short source's rows past the boundary to the next page", () => {
      expect(
        cutPage("desc", [
          { utimes: [30, 20], full: true },
          { utimes: [25, 5], full: false },
        ]),
      ).toEqual({ consumed: [1, 1], next: 20 });
    });

    it("leaves every row of the boundary second, from every source, to the next page", () => {
      expect(
        cutPage("desc", [
          { utimes: [30, 20, 20], full: true },
          { utimes: [20, 20, 10], full: false },
        ]),
      ).toEqual({ consumed: [1, 0], next: 20 });
    });

    it.each([
      ["the other source has rows there too", { utimes: [20, 10], full: false }],
      ["the other source is empty", { utimes: [], full: false }],
    ])("flags a second that fills a whole page when %s", (_, other) => {
      expect(cutPage("desc", [{ utimes: [20, 20], full: true }, other])).toEqual({
        crowdedSecond: 20,
      });
    });
  });
});
