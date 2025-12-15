import { getUserHashes } from "../user";
test("stable user", () => {
  expect(getUserHashes("test-user-id")).toMatchSnapshot();
});
