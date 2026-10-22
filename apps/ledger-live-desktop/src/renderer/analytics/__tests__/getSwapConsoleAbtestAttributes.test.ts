import { getSwapConsoleAbtestAttributes } from "../getSwapConsoleAbtestAttributes";

describe("getSwapConsoleAbtestAttributes", () => {
  it("falls back to the current experience when the flag is missing", () => {
    expect(getSwapConsoleAbtestAttributes(null)).toEqual({
      isEnabled: false,
      console: true,
      quickAction: false,
    });
  });

  it("reports the flag state and its params", () => {
    expect(
      getSwapConsoleAbtestAttributes({
        enabled: true,
        params: { console: false, quickAction: true },
      }),
    ).toEqual({
      isEnabled: true,
      console: false,
      quickAction: true,
    });
  });
});
