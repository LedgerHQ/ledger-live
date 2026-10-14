import * as ExpoClipboard from "expo-clipboard";
import { copyToClipboard, readClipboard } from "./clipboard.native";

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn(),
}));

const mockedSetStringAsync = jest.mocked(ExpoClipboard.setStringAsync);
const mockedGetStringAsync = jest.mocked(ExpoClipboard.getStringAsync);

describe("clipboard (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("copies the text and returns the native result", async () => {
    mockedSetStringAsync.mockResolvedValue(true);

    await expect(copyToClipboard("0xabc")).resolves.toBe(true);
    expect(mockedSetStringAsync).toHaveBeenCalledWith("0xabc");
  });

  it("returns false when the native copy rejects", async () => {
    mockedSetStringAsync.mockRejectedValue(new Error("unavailable"));

    await expect(copyToClipboard("0xabc")).resolves.toBe(false);
  });

  it("reads the clipboard text", async () => {
    mockedGetStringAsync.mockResolvedValue("0xabc");

    await expect(readClipboard()).resolves.toBe("0xabc");
  });

  it("returns an empty string when the native read rejects", async () => {
    mockedGetStringAsync.mockRejectedValue(new Error("unavailable"));

    await expect(readClipboard()).resolves.toBe("");
  });
});
