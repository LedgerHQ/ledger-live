import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { buildIterateResult as hederaBuildIterateResult } from "@ledgerhq/coin-hedera/bridge/synchronisation";
import { getCoinFrameworkCurrencyBridge } from "./currencyBridge";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  makeScanAccounts: jest.fn(),
}));

const mockMakeScanAccounts = makeScanAccounts as jest.Mock;

describe("getCoinFrameworkCurrencyBridge", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards hedera's mirror-node account lookup as buildIterateResult when a currency is given", async () => {
    await getCoinFrameworkCurrencyBridge(
      "hedera",
      "local",
      undefined,
      getCryptoCurrencyById("hedera"),
    );

    expect(mockMakeScanAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ buildIterateResult: hederaBuildIterateResult }),
    );
  });

  it("falls back to the default derivation-path walk when no currency is given", async () => {
    await getCoinFrameworkCurrencyBridge("hedera", "local");

    expect(mockMakeScanAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ buildIterateResult: undefined }),
    );
  });
});
