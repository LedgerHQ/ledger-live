import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isTestnet } from "../logic";
import { fetchEpochInfo } from "./getEpochInfo";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockIsTestnet = jest.mocked(isTestnet);

// isTestnet is mocked, so the concrete currency value is irrelevant to routing.
const currency = { id: "cardano" } as CryptoCurrency;

const protocolParams = { a0: 0.3, rho: 0.003, tau: 0.2 };
const currentEpoch = {
  number: 500,
  reserves: "13000000000000",
  activeStake: "23000000000000",
  protocolParams,
};

describe("fetchEpochInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs the epoch-params endpoint and maps the current epoch", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: { cardano: [{ currentEpoch }] } } as never);

    const result = await fetchEpochInfo(currency);

    expect(result).toEqual({
      number: 500,
      reserves: "13000000000000",
      activeStake: "23000000000000",
      params: protocolParams,
    });
    expect(mockNetwork.mock.calls[0][0].method).toBe("GET");
  });

  it("throws when the response shape is unexpected", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: {} } as never);

    await expect(fetchEpochInfo(currency)).rejects.toThrow(
      "Cardano epoch params: unexpected response shape",
    );
  });

  it("routes to the testnet endpoint for a testnet currency", async () => {
    mockIsTestnet.mockReturnValue(true);
    mockNetwork.mockResolvedValue({ data: { cardano: [{ currentEpoch }] } } as never);

    await fetchEpochInfo(currency);

    expect(mockIsTestnet).toHaveBeenCalledWith(currency);
  });
});
