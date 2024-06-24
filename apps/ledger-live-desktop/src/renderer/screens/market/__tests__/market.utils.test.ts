/**
 * @jest-environment jsdom
 */

import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE, getCurrentPage, isDataStale } from "../utils";

describe("Market utils", () => {
  describe("isDataStale", () => {
    it("Should return stale === true", () => {
      const current = new Date();
      const isStaled = isDataStale(1711733433593, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const isStaled2 = isDataStale(156733433533, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const isStaled3 = isDataStale(1211333433593, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const fiveMinuteStale = isDataStale(
        current.setMinutes(current.getMinutes() - 5),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      expect(isStaled).toBeTruthy();
      expect(isStaled2).toBeTruthy();
      expect(isStaled3).toBeTruthy();
      expect(fiveMinuteStale).toBeTruthy();
    });

    it("Should return stale === false", () => {
      const current = new Date();

      const isStaled = isDataStale(current.getTime(), REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);
      const oneMinuteFresh = isDataStale(
        current.setMinutes(current.getMinutes() - 1),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      const oneMinute59Fresh = isDataStale(
        current.setMinutes(current.getMinutes() - 1, current.getSeconds() - 59),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      expect(isStaled).toBeFalsy();
      expect(oneMinuteFresh).toBeFalsy();
      expect(oneMinute59Fresh).toBeFalsy();
    });
  });

  describe("getCurrentPage", () => {
    it("Should return 1", () => {
      const page = getCurrentPage(0, 50);

      expect(page).toEqual(1);
    });

    it("Should return 5", () => {
      const page = getCurrentPage(17500, 50);

      expect(page).toEqual(5);
    });
  });
});
