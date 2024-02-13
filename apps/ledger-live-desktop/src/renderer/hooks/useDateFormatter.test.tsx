/**
 * @jest-environment jsdom
 */

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import React from "react";
import * as redux from "react-redux";
import { Provider } from "react-redux";
import { combineReducers, legacy_createStore as createStore } from "redux";
import settings from "../reducers/settings";
import { dateEq, getDatesAround, useDateFormatter, useCalendarFormatter } from "./useDateFormatter";

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

describe("useDateFormatter", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("dateEq", () => {
    const origin = new Date("January 1, 2000 10:00:00");
    let date: Date;

    beforeEach(() => {
      date = new Date(origin);
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

  describe("useDateFormatter", () => {
    // Needed to wrap hook in a Redux Store
    const HookWrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    // prepare mocking useSelector
    const spy = jest.spyOn(redux, "useSelector");

    let f: ReturnType<typeof useDateFormatter>;

    const setLocale_Mock = (
      locale: string,
      opts?: {
        intlOpts?: Intl.DateTimeFormatOptions;
      },
    ) => {
      spy.mockReturnValue(locale);
      const { result } = renderHook(() => useDateFormatter(opts?.intlOpts), {
        wrapper: HookWrapper,
      });
      f = result.current;
    };

    test("should format date properly", () => {
      const date = new Date("February 1, 2000 10:00:00");

      setLocale_Mock("fr");
      expect(f(date)).toEqual("01/02/2000");

      setLocale_Mock("en");
      expect(f(date)).toEqual("2/1/2000");

      setLocale_Mock("pt-BR");
      expect(f(date)).toEqual("01/02/2000");
    });
  });
});

describe("useCalendarFormatter", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Needed to wrap hook in a Redux Store
  const HookWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const spy = jest.spyOn(redux, "useSelector");

  let f: ReturnType<typeof useDateFormatter>;

  const setLocale_Mock = (
    locale: string,
    opts?: {
      intlOpts?: Intl.DateTimeFormatOptions;
    },
  ) => {
    spy.mockReturnValue(locale);
    const { result } = renderHook(() => useCalendarFormatter(opts?.intlOpts), {
      wrapper: HookWrapper,
    });
    f = result.current;
  };

  test("calendar", () => {
    const yesterday = new Date("January 31, 2000 10:00:00");
    const today = new Date("February 1, 2000 10:00:00");
    const tomorrow = new Date("February 2, 2000 10:00:00");
    jest.setSystemTime(today);

    setLocale_Mock("en");

    expect(f(yesterday)).toEqual("1/31/2000 – calendar.yesterday");
    expect(f(today)).toEqual("2/1/2000 – calendar.today");
    expect(f(tomorrow)).toEqual("2/2/2000 – calendar.tomorrow");
  });
});
