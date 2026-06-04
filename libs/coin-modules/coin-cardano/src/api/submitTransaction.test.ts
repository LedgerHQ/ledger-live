import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isTestnet } from "../logic";
import { submitTransaction } from "./submitTransaction";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockIsTestnet = jest.mocked(isTestnet);

// isTestnet is mocked, so the concrete currency value is irrelevant to routing.
const currency = { id: "cardano" } as CryptoCurrency;

describe("submitTransaction", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POSTs the raw transaction to the mainnet submit endpoint and returns the hash", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: { transaction: { hash: "abc123" } } } as never);

    const result = await submitTransaction({ transaction: "deadbeef", currency });

    expect(result).toEqual({ hash: "abc123" });
    const call = mockNetwork.mock.calls[0][0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("cardano.coin.ledger.com");
    expect(call.url).toMatch(/\/v1\/transaction\/submit$/);
    expect(call.data).toEqual({ transaction: "deadbeef" });
  });

  it("routes to the testnet endpoint for a testnet currency", async () => {
    mockIsTestnet.mockReturnValue(true);
    mockNetwork.mockResolvedValue({ data: { transaction: { hash: "h" } } } as never);

    await submitTransaction({ transaction: "deadbeef", currency });

    expect(mockIsTestnet).toHaveBeenCalledWith(currency);
    expect(mockNetwork.mock.calls[0][0].url).toContain("cardanoscan");
  });
});
