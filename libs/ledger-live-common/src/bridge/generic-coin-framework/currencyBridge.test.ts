import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { getCoinFrameworkCurrencyBridge } from "./currencyBridge";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  makeScanAccounts: jest.fn(),
}));

jest.mock("@ledgerhq/coin-hedera/network/api", () => ({
  apiClient: { getAccountsForPublicKey: jest.fn() },
}));

jest.mock("../../config", () => ({
  getCurrencyConfiguration: () => ({ networkType: "mainnet" }),
}));

const mockMakeScanAccounts = makeScanAccounts as jest.Mock;
const mockGetAccountsForPublicKey = apiClient.getAccountsForPublicKey as jest.Mock;

describe("getCoinFrameworkCurrencyBridge", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards hedera's mirror-node account lookup as listAddressesForKey", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([{ account: "0.0.1" }, { account: "0.0.2" }]);

    await getCoinFrameworkCurrencyBridge(
      "hedera",
      "local",
      undefined,
      getCryptoCurrencyById("hedera"),
    );

    const { listAddressesForKey } = mockMakeScanAccounts.mock.calls[0][0];
    await expect(listAddressesForKey({ publicKey: "pubkey" })).resolves.toEqual(["0.0.1", "0.0.2"]);
    expect(mockGetAccountsForPublicKey).toHaveBeenCalledWith({
      configOrCurrencyId: { networkType: "mainnet" },
      publicKey: "pubkey",
    });
  });

  it("falls back to the default derivation-path walk when no currency is given", async () => {
    await getCoinFrameworkCurrencyBridge("hedera", "local");

    expect(mockMakeScanAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ listAddressesForKey: undefined }),
    );
  });
});
