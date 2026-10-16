import { apiClient } from "../network/api";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import { getAddressesForPublicKey } from "./getAddressesForPublicKey";

jest.mock("../network/api");

const mockGetAccountsForPublicKey = jest.mocked(apiClient.getAccountsForPublicKey);

describe("getAddressesForPublicKey", () => {
  const publicKey = "302a300506032b6570032100abcdef";
  const mockConfig = getMockedConfig();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the account ids the mirror node holds for the key", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([
      getMockedMirrorAccount({ account: "0.0.1" }),
      getMockedMirrorAccount({ account: "0.0.2" }),
    ]);

    const addresses = await getAddressesForPublicKey(mockConfig, publicKey);

    expect(mockGetAccountsForPublicKey).toHaveBeenCalledTimes(1);
    expect(mockGetAccountsForPublicKey).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      publicKey,
    });
    expect(addresses).toEqual(["0.0.1", "0.0.2"]);
  });

  it("lists no address for a key the mirror node does not know", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([]);

    await expect(getAddressesForPublicKey(mockConfig, publicKey)).resolves.toEqual([]);
  });

  it("propagates a mirror node failure", async () => {
    mockGetAccountsForPublicKey.mockRejectedValue(new Error("mirror node down"));

    await expect(getAddressesForPublicKey(mockConfig, publicKey)).rejects.toThrow(
      "mirror node down",
    );
  });
});
