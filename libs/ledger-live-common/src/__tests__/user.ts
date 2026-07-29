import { getUserHashes } from "../user";
import { getEnv } from "@shared/env";
test("stable user", () => {
  expect(getUserHashes(getEnv("USER_ID"))).toMatchSnapshot();
});
