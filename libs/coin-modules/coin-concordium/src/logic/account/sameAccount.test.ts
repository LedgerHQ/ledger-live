import { VALID_ADDRESS, VALID_ADDRESS_2 } from "../../test/fixtures";
import { accountKey, isSameAccount } from "./sameAccount";

// Two aliases of mainnet account 82886, both seen on chain: the first 29 bytes
// match and the last 3 differ.
const ALIAS = "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4EpmdNS2q4LmLd";
const OTHER_ALIAS = "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4Epmew49ZXjfnk";

// VALID_ADDRESS with its 29th byte changed: the last byte that names the account.
const NEIGHBOUR_ACCOUNT = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qb5MqDb8vGu";

describe("isSameAccount", () => {
  it("should match two aliases of one account", () => {
    expect(isSameAccount(ALIAS, OTHER_ALIAS)).toBe(true);
  });

  it("should match an address with itself", () => {
    expect(isSameAccount(VALID_ADDRESS, VALID_ADDRESS)).toBe(true);
  });

  it("should tell two accounts apart", () => {
    expect(isSameAccount(VALID_ADDRESS, VALID_ADDRESS_2)).toBe(false);
  });

  it("should tell two accounts apart when only the last account byte differs", () => {
    expect(isSameAccount(VALID_ADDRESS, NEIGHBOUR_ACCOUNT)).toBe(false);
  });

  it("should not match an empty address", () => {
    expect(isSameAccount("", VALID_ADDRESS)).toBe(false);
  });

  it("should not match a string that is not an address", () => {
    expect(isSameAccount("someone-else", VALID_ADDRESS)).toBe(false);
  });
});

describe("accountKey", () => {
  it("should be the same for two aliases of one account", () => {
    expect(accountKey(ALIAS)).toBe(accountKey(OTHER_ALIAS));
  });

  it("should be the 29 bytes naming the account", () => {
    expect(accountKey(ALIAS)).toBe("a6b278e43b0f45c7343960c6c75fe99031afdba450e344db66bc57d576");
  });

  it("should tell two accounts apart when only the last account byte differs", () => {
    expect(accountKey(VALID_ADDRESS)).not.toBe(accountKey(NEIGHBOUR_ACCOUNT));
  });

  it("should be undefined for a string that is not an address", () => {
    expect(accountKey("someone-else")).toBeUndefined();
  });
});
