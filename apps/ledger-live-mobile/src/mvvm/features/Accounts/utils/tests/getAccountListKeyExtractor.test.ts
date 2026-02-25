import getAccountListKeyExtractor from "../getAccountListKeyExtractor";
import { Account } from "@ledgerhq/types-live";

describe("getAccountListKeyExtractor", () => {
  it("should return the id of an Account", () => {
    const account = {
      id: "account1",
      seedIdentifier: "Account 1",
    } as Account;
    const result = getAccountListKeyExtractor(account);
    expect(result).toBe("account1");
  });
});
