import "../__tests__/test-helpers/setup";
import { PLATFORM_VERSION } from "./constants";
import { getPlatformVersion } from "./version";
test("version is defined by setup", () => {
  expect(getPlatformVersion()).toBe(PLATFORM_VERSION);
});
