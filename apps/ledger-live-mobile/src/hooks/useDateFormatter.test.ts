import { renderHook } from "@testing-library/react-native";
import { useSelector } from "react-redux";
import { useFormatDate } from "./useDateFormatter";
import {
  ddmmyyyyFormatter,
  Format,
  genericFormatter,
  mmddyyyyFormatter,
} from "~/components/DateFormat/formatter.util";

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}));

jest.mock("~/components/DateFormat/formatter.util", () => ({
  ddmmyyyyFormatter: { format: jest.fn() },
  mmddyyyyFormatter: { format: jest.fn() },
  genericFormatter: jest.fn(),
  Format: {
    default: "default",
    ddmmyyyy: "ddmmyyyy",
    mmddyyyy: "mmddyyyy",
  },
}));

describe("useFormatDate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { dateFormat: Format.default, mockLanguage: "fr", expectedValue: "25/06/2025" },
    { dateFormat: Format.default, mockLanguage: "en", expectedValue: "6/25/2025" },
    { dateFormat: Format.ddmmyyyy, mockLanguage: "fr", expectedValue: "25/06/2025" },
    { dateFormat: Format.ddmmyyyy, mockLanguage: "en", expectedValue: "25/06/2025" },
    { dateFormat: Format.mmddyyyy, mockLanguage: "en", expectedValue: "6/25/2025" },
    { dateFormat: Format.mmddyyyy, mockLanguage: "fr", expectedValue: "6/25/2025" },
  ])(
    "should return the correct date format for language $mockLanguage and format $dateFormat",
    ({ dateFormat, mockLanguage, expectedValue }) => {
      const mockDate = new Date("2025-06-25");

      (useSelector as jest.Mock).mockReturnValueOnce(mockLanguage).mockReturnValueOnce(dateFormat);

      if (dateFormat === Format.default) {
        const mockGenericFormatter = { format: jest.fn(() => expectedValue) };
        (genericFormatter as jest.Mock).mockReturnValue(mockGenericFormatter);
      } else if (dateFormat === Format.ddmmyyyy) {
        (ddmmyyyyFormatter.format as jest.Mock).mockReturnValue(expectedValue);
      } else if (dateFormat === Format.mmddyyyy) {
        (mmddyyyyFormatter.format as jest.Mock).mockReturnValue(expectedValue);
      }

      const { result } = renderHook(() => useFormatDate());
      expect(result.current(mockDate)).toBe(expectedValue);
    },
  );
});
