import { getHistoryExportFileName } from "./getHistoryExportFileName";

describe("getHistoryExportFileName", () => {
  it("names the file after the local date, padded, without extension", () => {
    expect(getHistoryExportFileName(new Date(2026, 0, 5, 23, 59))).toBe(
      "ledgerwallet-operations-2026.01.05",
    );
  });
});
