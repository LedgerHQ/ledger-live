import "../__tests__/test-helpers/setup";
import { getWalletAPIVersion } from "./version";
test("version is defined by setup", () => {
  expect(getWalletAPIVersion()).toBe("1.1.0");
});
