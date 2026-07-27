import { LedgerAPI5xx } from "@ledgerhq/errors";
import network from "@ledgerhq/live-network/network";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import { AxiosHeaders, type AxiosResponse } from "axios";
import ChainwatchAccountManager from "./ChainwatchAccountManager";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);
const networkOk = (data: unknown): AxiosResponse<unknown> => ({
  data,
  status: 200,
  statusText: "OK",
  headers: new AxiosHeaders(),
  config: { headers: new AxiosHeaders() },
});
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
    mockedNetwork.mockRejectedValueOnce(error);

    await expect(accountManager.registerNewAddresses(["0x01"])).rejects.toBe(error);
  });

  it("should register only missing addresses", async () => {
    accountManager.suffixes = ["0x01"];
    mockedNetwork.mockResolvedValueOnce(networkOk(undefined));

    await accountManager.registerNewAddresses(["0x01", "0x02", ""]);

    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "PUT",
      url: "https://chainwatch/avax/account/user-id/addresses/",
      data: ["0x02"],
    });
  });

  it("should remove only subscribed addresses", async () => {
    accountManager.suffixes = ["0x01"];
    mockedNetwork.mockResolvedValueOnce(networkOk(undefined));

    await accountManager.removeAddresses(["0x01", "0x02", ""]);

    expect(mockedNetwork).toHaveBeenCalledWith({
      method: "DELETE",
      url: "https://chainwatch/avax/account/user-id/addresses/",
      data: ["0x01"],
    });
  });

  it("should preserve case when matching non-hexadecimal addresses", () => {
    accountManager.suffixes = ["AbCd"];

    expect(accountManager.accountAlreadySubscribed("prefixAbCd")).toBe(true);
    expect(accountManager.accountAlreadySubscribed("prefixabcd")).toBe(false);
  });

  it("should register a new address after removing one with the same suffix", async () => {
    accountManager.suffixes = ["01"];
    mockedNetwork
      .mockResolvedValueOnce(networkOk(undefined))
      .mockResolvedValueOnce(networkOk(undefined));

    await accountManager.removeAddresses(["0xAA01"]);
    await accountManager.registerNewAddresses(["0xBB01"]);

    expect(mockedNetwork).toHaveBeenNthCalledWith(2, {
      method: "PUT",
      url: "https://chainwatch/avax/account/user-id/addresses/",
      data: ["0xBB01"],
    });
  });

  it("should load existing suffixes without creating an account", async () => {
    mockedNetwork.mockResolvedValueOnce(
      networkOk({ suffixes: ["0x01"], monitors: [], targets: [] }),
    );

    await expect(accountManager.loadChainwatchAccount()).resolves.toEqual({
      suffixes: ["0x01"],
      monitors: [],
      targets: [],
    });
    expect(accountManager.suffixes).toEqual(["0x01"]);
    expect(mockedNetwork).toHaveBeenCalledTimes(1);
  });

  it("should update a monitor when its confirmation count changed", async () => {
    mockedNetwork
      .mockResolvedValueOnce(
        networkOk({
          suffixes: [],
          monitors: [
            { id: 1, type: "send", confirmations: 0 },
            { id: 2, type: "receive", confirmations: 1 },
          ],
          targets: [{ id: 1, type: "braze", equipment: "user-id" }],
        }),
      )
      .mockResolvedValueOnce(networkOk(undefined));

    await accountManager.setupChainwatchAccount();

    expect(mockedNetwork).toHaveBeenNthCalledWith(2, {
      method: "PUT",
      url: "https://chainwatch/avax/account/user-id/monitor/",
      data: { confirmations: 1, type: "send" },
    });
    expect(mockedNetwork).toHaveBeenCalledTimes(2);
  });
});
