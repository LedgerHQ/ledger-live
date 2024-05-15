import { getAccountNumFromPath } from "./logic";

describe("getAccountNumFromPath", () => {
  it("should return undefined for invalid account number", () => {
    const account = getAccountNumFromPath("44'/616'/4'/0/0");
    expect(account).toBe(undefined);
  });

  it("should return undefined for unsupported path", () => {
    const account = getAccountNumFromPath("44'/616'/4/0/0");
    expect(account).toBe(undefined);
  });

  it("should return the account number", () => {
    const account = getAccountNumFromPath("44'/12586'/4'/0/0");
    expect(account).toBe(4);
  });
});
