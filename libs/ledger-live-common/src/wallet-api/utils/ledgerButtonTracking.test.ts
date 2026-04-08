import network from "@ledgerhq/live-network/network";
import { isLedgerButtonReferrer, reportLedgerButtonBroadcast } from "./ledgerButtonTracking";

jest.mock("@ledgerhq/live-network/network");

const mockedNetwork = jest.mocked(network);

describe("isLedgerButtonReferrer", () => {
  it("should return true when referrer starts with LedgerButton_ prefix", () => {
    expect(isLedgerButtonReferrer("LedgerButton_abc123")).toBe(true);
  });

  it("should return false when referrer has a different prefix", () => {
    expect(isLedgerButtonReferrer("SomeOther_abc123")).toBe(false);
  });

  it("should return false when referrer is undefined", () => {
    expect(isLedgerButtonReferrer(undefined)).toBe(false);
  });

  it("should return false when referrer is empty", () => {
    expect(isLedgerButtonReferrer("")).toBe(false);
  });

  it("should return true when referrer is exactly the prefix with no suffix", () => {
    expect(isLedgerButtonReferrer("LedgerButton_")).toBe(true);
  });
});

describe("reportLedgerButtonBroadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNetwork.mockResolvedValue({} as never);
  });

  it("should POST transaction data to the ledgerb API", () => {
    reportLedgerButtonBroadcast({
      dappId: "my-dapp",
      chainId: 1,
      networkName: "ethereum",
      transactionHash: "0xabc",
      referrer: "LedgerButton_xyz",
    });

    expect(mockedNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://ledgerb.api.ledger.com/event",
        headers: { "X-Ledger-Domain": "my-dapp" },
        data: expect.objectContaining({
          name: "transaction-flow-completion",
          type: "transaction_flow_completion",
          data: expect.objectContaining({
            transaction_dapp_id: "my-dapp",
            blockchain_network_selected: "ethereum",
            chain_id: "1",
            referrer: "LedgerButton_xyz",
            transaction_hash: "0xabc",
          }),
        }),
      }),
    );
  });

  it("should stringify chainId in the payload", () => {
    reportLedgerButtonBroadcast({
      dappId: "d",
      chainId: 137,
      networkName: "polygon",
      transactionHash: "0x1",
      referrer: "LedgerButton_r",
    });

    const payload = mockedNetwork.mock.calls[0][0] as Record<string, unknown>;
    const data = payload.data as { data: { chain_id: string } };
    expect(data.data.chain_id).toBe("137");
  });

  it("should silently swallow network errors", async () => {
    mockedNetwork.mockRejectedValue(new Error("network down"));

    expect(() =>
      reportLedgerButtonBroadcast({
        dappId: "d",
        chainId: 1,
        networkName: "ethereum",
        transactionHash: "0x1",
        referrer: "LedgerButton_r",
      }),
    ).not.toThrow();

    // Give the catch handler time to run
    await new Promise(process.nextTick);
  });
});
