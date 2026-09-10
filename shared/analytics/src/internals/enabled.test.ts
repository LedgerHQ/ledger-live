import { setEnabledFunction } from "../registry";
import { isEnabled } from "./enabled";

describe("isEnabled", () => {
  beforeEach(() => {
    setEnabledFunction(undefined);
  });

  it("tracking is disabled by default", () => {
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is enabled when the enabled function returns true", () => {
    setEnabledFunction(() => true);
    expect(isEnabled()).toEqual(true);
  });

  it("tracking is disabled when the enabled function returns false", () => {
    setEnabledFunction(() => false);
    expect(isEnabled()).toEqual(false);
  });

  it("tracking is disabled when the enabled function is not set", () => {
    setEnabledFunction(undefined);
    expect(isEnabled()).toEqual(false);
  });
});
