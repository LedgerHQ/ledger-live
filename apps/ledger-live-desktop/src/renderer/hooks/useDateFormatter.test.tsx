/**
 * @jest-environment jsdom
 */

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { combineReducers, createStore } from "redux";
import settings from "../reducers/settings";
import { dateEq, getDatesAround } from "./useDateFormatter";

const MILLISECOND = 1000;
const SECOND = 1 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const store = createStore(
  combineReducers({
    settings,
  }),
);

// const Wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

describe("useDateFormatter", () => {
  describe("dateEq", () => {
    const origin = new Date("January 1, 2000 10:00:00");
    let date: Date;

    beforeEach(() => {
      date = new Date(origin.getTime());
    });

    test("should returns true when 2 equal dates are given", () => {
      expect(dateEq(origin, origin)).toBeTruthy();
    });

    [
      ["milliseconds", MILLISECOND],
      ["seconds", SECOND],
      ["minutes", MINUTE],
      ["hours", HOUR],
    ].map(([testName, time]) => {
      test(`should returns true when dates are equal but ${testName} are not`, () => {
        date.setTime(origin.getTime() + 10 * Number(time));
        expect(dateEq(origin, date)).toBeTruthy();
      });
    });

    test("should returns false when 2 different dates are given", () => {
      date.setTime(origin.getTime() + 10 * Number(DAY));
      expect(dateEq(origin, date)).toBeFalsy();
    });
  });

  describe("getDatesAround", () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    describe("handling days", () => {
      test("should correctly returns yesterday, today and tomorrow", () => {
        const time = new Date("August 16, 2023 10:00:00");
        jest.setSystemTime(time);

        const { yesterday, today, tomorrow } = getDatesAround();

        expect(dateEq(yesterday, new Date("August 15, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(today, new Date("August 16, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(tomorrow, new Date("August 17, 2023 10:00:00"))).toBeTruthy();
      });
    });

    describe("handling months", () => {
      test("should correctly returns yesterday, today and tomorrow", () => {
        const time = new Date("August 1, 2023 10:00:00");
        jest.setSystemTime(time);

        const { yesterday, today, tomorrow } = getDatesAround();

        expect(dateEq(yesterday, new Date("July 31, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(today, new Date("August 1, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(tomorrow, new Date("August 2, 2023 10:00:00"))).toBeTruthy();
      });
    });

    describe("handling years", () => {
      test("should correctly returns yesterday, today and tomorrow", () => {
        const time = new Date("December 31, 2023 10:00:00");
        jest.setSystemTime(time);

        const { yesterday, today, tomorrow } = getDatesAround();

        expect(dateEq(yesterday, new Date("December 30, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(today, new Date("December 31, 2023 10:00:00"))).toBeTruthy();
        expect(dateEq(tomorrow, new Date("January 1, 2024 10:00:00"))).toBeTruthy();
      });
    });
  });

  describe("useDateFormatter", () => {});
});
