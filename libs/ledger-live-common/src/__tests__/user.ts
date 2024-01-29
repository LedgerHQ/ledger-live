import { getUserHashes } from "../user";
import { getEnv } from "@ledgerhq/live-env";
test("stable user", () => {
  expect(getUserHashes(getEnv("USER_ID"))).toMatchSnapshot();
});
