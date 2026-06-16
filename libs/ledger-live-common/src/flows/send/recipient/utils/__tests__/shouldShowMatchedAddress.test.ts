import { shouldShowMatchedAddress } from "../shouldShowMatchedAddress";

describe("shouldShowMatchedAddress", () => {
  it("hides the matched-address row while there is no valid recipient", () => {
    expect(
      shouldShowMatchedAddress({
        showMatchedAddress: false,
        hasMemo: true,
        hasFilledMemo: true,
        hasMemoError: false,
      }),
    ).toBe(false);
  });

  it("shows the matched-address row immediately on chains without memo", () => {
    expect(
      shouldShowMatchedAddress({
        showMatchedAddress: true,
        hasMemo: false,
        hasFilledMemo: false,
        hasMemoError: false,
      }),
    ).toBe(true);
  });

  it("keeps it hidden on memo chains until the memo is filled or skipped", () => {
    expect(
      shouldShowMatchedAddress({
        showMatchedAddress: true,
        hasMemo: true,
        hasFilledMemo: false,
        hasMemoError: false,
      }),
    ).toBe(false);
  });

  it("shows it on memo chains once the memo is filled (or skipped as NO_MEMO)", () => {
    expect(
      shouldShowMatchedAddress({
        showMatchedAddress: true,
        hasMemo: true,
        hasFilledMemo: true,
        hasMemoError: false,
      }),
    ).toBe(true);
  });

  it("keeps it hidden when the filled memo has an error", () => {
    expect(
      shouldShowMatchedAddress({
        showMatchedAddress: true,
        hasMemo: true,
        hasFilledMemo: true,
        hasMemoError: true,
      }),
    ).toBe(false);
  });
});
