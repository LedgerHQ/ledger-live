import { renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useFormatPrivateSyncDate } from "./useFormatPrivateSyncDate";

// Jan 15, 2024 at 14:30
const REFERENCE_DATE = new Date(2024, 0, 15, 14, 30, 0);

const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
};

function renderWithLocale(locale: string) {
  return renderHook(() => useFormatPrivateSyncDate(), {
    overrideInitialState: (state: State) => ({
      ...state,
      settings: { ...state.settings, locale },
    }),
  });
}

describe("useFormatPrivateSyncDate", () => {
  it("formats using the locale from settings", () => {
    const { result } = renderWithLocale("en-US");

    expect(result.current(REFERENCE_DATE)).toBe(
      new Intl.DateTimeFormat("en-US", FORMAT_OPTIONS).format(REFERENCE_DATE),
    );
  });

  it("includes time in the output", () => {
    const { result } = renderWithLocale("en-US");

    // REFERENCE_DATE is 14:30 -> en-US renders as "2:30 PM"
    expect(result.current(REFERENCE_DATE)).toMatch(/2:30/);
  });

  it("produces different output for different locales", () => {
    const { result: enResult } = renderWithLocale("en-US");
    const { result: frResult } = renderWithLocale("fr-FR");

    expect(enResult.current(REFERENCE_DATE)).not.toBe(frResult.current(REFERENCE_DATE));
  });
});
