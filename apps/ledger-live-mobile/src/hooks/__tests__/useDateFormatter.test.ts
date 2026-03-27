import { renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { Format } from "~/components/DateFormat/formatter.util";
import { useFormatDate, useFormatDaySection } from "../useDateFormatter";

// Fixed reference date used across tests: January 15, 2024
const REFERENCE_DATE = new Date(2024, 0, 15);

describe("useFormatDate", () => {
  describe("Format.default", () => {
    it("formats using the language from settings", () => {
      const { result } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            language: "en",
            dateFormat: Format.default,
          },
        }),
      });

      const expected = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(REFERENCE_DATE);

      expect(result.current(REFERENCE_DATE)).toBe(expected);
    });

    it("changes output when language changes", () => {
      const { result: enResult } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: { ...state.settings, language: "en", dateFormat: Format.default },
        }),
      });

      const { result: frResult } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: { ...state.settings, language: "fr", dateFormat: Format.default },
        }),
      });

      // Both format the same date but the locale-specific output differs
      const enOutput = enResult.current(REFERENCE_DATE);
      const frOutput = frResult.current(REFERENCE_DATE);
      expect(enOutput).not.toBe(frOutput);
    });
  });

  describe("Format.ddmmyyyy", () => {
    it("formats as DD/MM/YYYY regardless of language setting", () => {
      const { result } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            language: "en",
            dateFormat: Format.ddmmyyyy,
          },
        }),
      });

      // ddmmyyyyFormatter uses fr-FR locale: 15/01/2024
      const expected = new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(REFERENCE_DATE);

      expect(result.current(REFERENCE_DATE)).toBe(expected);
    });

    it("produces day-first order", () => {
      const { result } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: { ...state.settings, dateFormat: Format.ddmmyyyy },
        }),
      });

      // REFERENCE_DATE is Jan 15 → day "15" should appear at the start
      expect(result.current(REFERENCE_DATE)).toMatch(/^15/);
    });
  });

  describe("Format.mmddyyyy", () => {
    it("formats as MM/DD/YYYY regardless of language setting", () => {
      const { result } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            language: "fr",
            dateFormat: Format.mmddyyyy,
          },
        }),
      });

      // mmddyyyyFormatter uses en-US locale: 1/15/2024
      const expected = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).format(REFERENCE_DATE);

      expect(result.current(REFERENCE_DATE)).toBe(expected);
    });

    it("produces month-first order", () => {
      const { result } = renderHook(() => useFormatDate(), {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: { ...state.settings, dateFormat: Format.mmddyyyy },
        }),
      });

      const output = result.current(REFERENCE_DATE);
      // Month (1) appears before day (15) in the string
      expect(output.indexOf("1")).toBeLessThan(output.indexOf("15"));
    });
  });
});

describe("useFormatDaySection", () => {
  // Freeze time at Jan 15, 2024, noon
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 'Today' for the current day", () => {
    const today = new Date(2024, 0, 15, 8, 30, 0);
    const { result } = renderHook(() => useFormatDaySection());
    expect(result.current(today)).toBe("Today");
  });

  it("returns 'Today' even when the time differs within the same calendar day", () => {
    const lateToday = new Date(2024, 0, 15, 23, 59, 59);
    const { result } = renderHook(() => useFormatDaySection());
    expect(result.current(lateToday)).toBe("Today");
  });

  it("returns 'Yesterday' for the previous calendar day", () => {
    const yesterday = new Date(2024, 0, 14);
    const { result } = renderHook(() => useFormatDaySection());
    expect(result.current(yesterday)).toBe("Yesterday");
  });

  it("returns a formatted long date for 2 days ago", () => {
    const twoDaysAgo = new Date(2024, 0, 13);
    const { result } = renderHook(() => useFormatDaySection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, language: "en" },
      }),
    });

    const expected = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(twoDaysAgo);

    expect(result.current(twoDaysAgo)).toBe(expected);
  });

  it("returns a formatted long date for a date far in the past", () => {
    const oldDate = new Date(2020, 5, 20); // Jun 20, 2020
    const { result } = renderHook(() => useFormatDaySection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, language: "en" },
      }),
    });

    const expected = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(oldDate);

    expect(result.current(oldDate)).toBe(expected);
  });

  it("uses the language from settings for the long date format", () => {
    const olderDate = new Date(2024, 0, 10);

    const { result: enResult } = renderHook(() => useFormatDaySection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, language: "en" },
      }),
    });

    const { result: frResult } = renderHook(() => useFormatDaySection(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, language: "fr" },
      }),
    });

    expect(enResult.current(olderDate)).not.toBe(frResult.current(olderDate));
  });
});
