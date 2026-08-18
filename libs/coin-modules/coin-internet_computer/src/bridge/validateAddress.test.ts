import { validateAddress } from "./validateAddress";

const VALID_ADDRESS = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";

describe("validateAddress", () => {
  it("returns true for a valid account identifier", async () => {
    expect(await validateAddress(VALID_ADDRESS, {})).toBe(true);
  });

  it("returns false for an invalid address", async () => {
    expect(await validateAddress("nothex", {})).toBe(false);
  });
});
