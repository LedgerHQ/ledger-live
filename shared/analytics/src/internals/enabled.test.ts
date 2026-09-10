import { setEnabledFn } from "../registry";
import { isEnabled } from "./enabled";

describe("isEnabled", () => {
  beforeEach(() => {
    setEnabledFn(undefined);
  });

  it("tracking is disabled by default", () => {
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is enabled when the enabled function returns true", () => {
    setEnabledFn(() => true);
    expect(isEnabled()).toEqual(true);
  });

  it("tracking is disabled when the enabled function returns false", () => {
    setEnabledFn(() => false);
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is disabled when the enabled function is not set", () => {
    setEnabledFn(undefined);
    expect(isEnabled()).toEqual(false);
  });
});
