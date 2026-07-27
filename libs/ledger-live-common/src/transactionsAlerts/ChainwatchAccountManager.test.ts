import { LedgerAPI5xx } from "@ledgerhq/errors";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import network from "@ledgerhq/live-network/network";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "../currencies";
import ChainwatchAccountManager from "./ChainwatchAccountManager";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);
const chainwatchNetwork: ChainwatchNetwork = {
  ledgerLiveId: "avalanche_c_chain",
  chainwatchId: "avax",
  nbConfirmations: 1,
};
let accountManager: ChainwatchAccountManager;

describe("ChainwatchAccountManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    accountManager = new ChainwatchAccountManager(
      "https://chainwatch",
      "user-id",
      chainwatchNetwork,
    );
  });

  it("should treat a missing Chainwatch account as absent", async () => {
    mockedNetwork.mockRejectedValueOnce({ status: 404 });

    await expect(accountManager.getChainwatchAccount()).resolves.toBeUndefined();
  });

  it("should ignore a missing Chainwatch account during removal", async () => {
    mockedNetwork.mockRejectedValueOnce({ status: 404 });

    await expect(accountManager.removeChainwatchAccount()).resolves.toBeUndefined();
  });

  it("should propagate a Chainwatch account removal failure", async () => {
    const error = new LedgerAPI5xx("unavailable", {
      status: 500,
      url: undefined,
      method: "DELETE",
    });
    mockedNetwork.mockRejectedValueOnce(error);

    await expect(accountManager.removeChainwatchAccount()).rejects.toBe(error);
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
