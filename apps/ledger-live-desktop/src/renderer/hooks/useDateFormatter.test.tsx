/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, test } from "@jest/globals";
import { combineReducers, createStore } from "redux";
import settings from "../reducers/settings";
import { dateEq } from "./useDateFormatter";

const MILLISECOND = 1000;
const SECOND = 1 * MILLISECOND;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const store = createStore(
  combineReducers({
    settings,
  }),
);

// const Wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

describe("useDateFormatter", () => {
  const origin = new Date("January 1, 2000 10:00:00");
  let date: Date;

  describe("dateEq", () => {
    beforeEach(() => {
      date = new Date(origin.getTime());
    });

    test("should returns true when 2 equal dates are given", () => {
      expect(dateEq(origin, origin)).toBeTruthy();
    });

    [
      ["seconds", SECOND],
      ["minutes", MINUTE],
      ["hours", HOUR],
    ].map(([testName, time]) => {
      test(`should returns true when dates are equals but ${testName} are not`, () => {
        date.setTime(origin.getTime() + 10 * Number(time));
        expect(dateEq(origin, date)).toBeTruthy();
      });
    });
  });
});
