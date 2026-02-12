import { Refresh, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { getActivityIndicatorIcon } from "../getActivityIndicatorIcon";

describe("getActivityIndicatorIcon", () => {
  it("returns Refresh when not error and not rotating", () => {
    expect(getActivityIndicatorIcon(false, false)).toBe(Refresh);
  });

  it("returns Warning when isError is true and not rotating", () => {
    expect(getActivityIndicatorIcon(true, false)).toBe(Warning);
  });

  it("returns Spinner when isRotating is true and not error", () => {
    expect(getActivityIndicatorIcon(false, true)).toBe(Spinner);
  });

  it("returns Spinner when both isError and isRotating are true (rotating takes precedence)", () => {
    expect(getActivityIndicatorIcon(true, true)).toBe(Spinner);
  });
});
