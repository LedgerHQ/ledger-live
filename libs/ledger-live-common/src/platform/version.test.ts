import "../__tests__/test-helpers/setup";
import { getPlatformVersion } from "./version";
test("version is defined by setup", () => {
  expect(getPlatformVersion()).toBe("1.1.0");
});
