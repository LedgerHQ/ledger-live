import { LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/errors";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import network from "@ledgerhq/live-network/network";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import ChainwatchAccountManager from "./ChainwatchAccountManager";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);
const chainwatchNetwork: ChainwatchNetwork = {
  ledgerLiveId: "avalanche_c_chain",
  chainwatchId: "avax",
  nbConfirmations: 1,
};
const accountManager = new ChainwatchAccountManager(
  "https://chainwatch",
  "user-id",
  chainwatchNetwork,
);

describe("ChainwatchAccountManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should treat a missing Chainwatch account as absent", async () => {
    mockedNetwork.mockRejectedValueOnce(
      new LedgerAPI4xx("not found", { status: 404, url: undefined, method: "GET" }),
    );

    await expect(accountManager.getChainwatchAccount()).resolves.toBeUndefined();
  });

  it("should propagate a Chainwatch account request failure", async () => {
    const error = new LedgerAPI5xx("unavailable", {
      status: 500,
      url: undefined,
      method: "GET",
    });
    mockedNetwork.mockRejectedValueOnce(error);

    await expect(accountManager.getChainwatchAccount()).rejects.toBe(error);
  });

  it("should propagate an address registration failure", async () => {
    const error = new LedgerAPI5xx("unavailable", {
      status: 500,
      url: undefined,
      method: "PUT",
    });
    const account = genAccount("account", {
      currency: getCryptoCurrencyById("avalanche_c_chain"),
    });
    mockedNetwork.mockRejectedValueOnce(error);

    await expect(accountManager.registerNewAccountsAddresses([account])).rejects.toBe(error);
  });
});
