/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import React from "react";
import * as redux from "react-redux";
import { Provider } from "react-redux";
import { combineReducers, legacy_createStore as createStore } from "redux";
import settings from "../reducers/settings";
import {
  dateEq,
  getDatesAround,
  useDateFormatter,
  useCalendarFormatter,
  useTechnicalDateTimeFn,
  useTechnicalDateFn,
  relativeTime,
  fromNow,
} from "./useDateFormatter";
import Prando from "prando";

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

describe("technical dates", () => {
  test("useTechnicalDateTimeFn", () => {
    const d1 = new Date("January 31, 2001 10:02:09 UTC");
    const d2 = new Date("February 1, 2003 23:07:10 UTC");
    const d3 = new Date("March 2, 2020 10:00:00 UTC");

    const { result } = renderHook(() => useTechnicalDateTimeFn());
    const f = result.current;

    expect(f(d1)).toEqual("2001.01.31-10.02.09");
    expect(f(d2)).toEqual("2003.02.01-23.07.10");
    expect(f(d3)).toEqual("2020.03.02-10.00.00");
  });

  test("useTechnicalDateFn", () => {
    const d1 = new Date("January 31, 2001 10:02:09 UTC");
    const d2 = new Date("February 1, 2003 23:07:10 UTC");
    const d3 = new Date("March 2, 2020 10:00:00 UTC");

    const { result } = renderHook(() => useTechnicalDateFn());
    const f = result.current;

    expect(f(d1)).toEqual("2001.01.31");
    expect(f(d2)).toEqual("2003.02.01");
    expect(f(d3)).toEqual("2020.03.02");
  });
});

describe("relative time", () => {
  test("relativeTime in the past", () => {
    const now = new Date();
    const d1 = new Date(now.getTime() - 23 * 1000);
    const d2 = new Date(now.getTime() - 3 * 60 * 1000);
    const d3 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const d4 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const d5 = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
    const d6 = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(relativeTime(now, d1)).toEqual("23 seconds ago");
    expect(relativeTime(now, d2)).toEqual("3 minutes ago");
    expect(relativeTime(now, d3)).toEqual("2 hours ago");
    expect(relativeTime(now, d4)).toEqual("2 days ago");
    expect(relativeTime(now, d5)).toEqual("2 months ago");
    expect(relativeTime(now, d6)).toEqual("2 years ago");
  });

  test("relativeTime in the future", () => {
    const now = new Date();
    const d1 = new Date(now.getTime() + 23 * 1000);
    const d2 = new Date(now.getTime() + 3 * 60 * 1000);
    const d3 = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const d4 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const d5 = new Date(now.getTime() + 2 * 30 * 24 * 60 * 60 * 1000);
    const d6 = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
    expect(relativeTime(now, d1)).toEqual("in 23 seconds");
    expect(relativeTime(now, d2)).toEqual("in 3 minutes");
    expect(relativeTime(now, d3)).toEqual("in 2 hours");
    expect(relativeTime(now, d4)).toEqual("in 2 days");
    expect(relativeTime(now, d5)).toEqual("in 2 months");
    expect(relativeTime(now, d6)).toEqual("in 2 years");
  });

  test("fromNow is equivalent to relativeTime", () => {
    const now = new Date();
    const prando = new Prando();
    for (let i = 0; i < 100; i++) {
      const d = new Date(
        now.getTime() + prando.nextInt(-500 * 24 * 60 * 60 * 1000, 500 * 24 * 60 * 60 * 1000),
      );
      expect(relativeTime(now, d)).toEqual(fromNow(d));
    }
  });
});
