import "../__tests__/test-helpers/setup";
import { WALLET_API_VERSION } from "./constants";
import { getWalletAPIVersion } from "./version";
test("version is defined by setup", () => {
  expect(getWalletAPIVersion()).toBe(WALLET_API_VERSION);
});
