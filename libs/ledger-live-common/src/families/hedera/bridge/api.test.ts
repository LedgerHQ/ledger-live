import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import hederaBridge, { getAddressesForPublicKey, keyControlsAccount } from "./api";

const getAccountsForPublicKeyMock = jest.fn();
jest.mock("@ledgerhq/coin-hedera/network/api", () => ({
  apiClient: {
    getAccountsForPublicKey: (...a: unknown[]) => getAccountsForPublicKeyMock(...a),
  },
}));

const config = { apiUrls: { mirrorNode: "https://mirror.test" } };
jest.mock("../../../config", () => ({
  getCurrencyConfiguration: () => config,
}));

const currency = getCryptoCurrencyById("hedera");

describe("hedera bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddressesForPublicKey", () => {
    it("returns the accounts the mirror node holds for the device key", async () => {
      getAccountsForPublicKeyMock.mockResolvedValue([{ account: "0.0.1" }, { account: "0.0.2" }]);

      const addresses = await getAddressesForPublicKey(currency, "pk");

      expect(addresses).toEqual(["0.0.1", "0.0.2"]);
      expect(getAccountsForPublicKeyMock).toHaveBeenCalledTimes(1);
      expect(getAccountsForPublicKeyMock).toHaveBeenCalledWith({
        configOrCurrencyId: config,
        publicKey: "pk",
      });
    });

    it("returns no address when the key controls no account", async () => {
      getAccountsForPublicKeyMock.mockResolvedValue([]);

      const addresses = await getAddressesForPublicKey(currency, "pk");

      expect(addresses).toEqual([]);
    });
  });

  it.each([
    ["pk", true],
    ["other-pk", false],
  ])("keyControlsAccount(%s) is %s for an account seeded by pk", (publicKey, expected) => {
    const account = { seedIdentifier: "pk" } as Account;

    expect(keyControlsAccount(publicKey, account)).toBe(expected);
  });

  it("looks up addresses by the derived public key", async () => {
    getAccountsForPublicKeyMock.mockResolvedValue([{ account: "0.0.1" }]);

    const addresses = await hederaBridge(currency).addressLookup?.getAddresses({
      address: "",
      path: "44/3030",
      publicKey: "pk",
    });

    expect(addresses).toEqual(["0.0.1"]);
    expect(getAccountsForPublicKeyMock).toHaveBeenCalledTimes(1);
    expect(getAccountsForPublicKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: "pk" }),
    );
  });
});
