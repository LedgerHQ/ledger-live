import { getUserHashes } from "../user";
import { getEnv } from "@ledgerhq/live-env";
test("stable user", () => {
  expect(getUserHashes(getEnv<string>("USER_ID"))).toMatchSnapshot();
});
