import { getUserHashes } from "../user";
test("stable user", () => {
  expect(getUserHashes()).toMatchSnapshot();
});
