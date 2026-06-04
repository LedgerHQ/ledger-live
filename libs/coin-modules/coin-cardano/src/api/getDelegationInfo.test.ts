import network from "@ledgerhq/live-network";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isTestnet } from "../logic";
import { getDelegationInfo } from "./getDelegationInfo";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockIsTestnet = jest.mocked(isTestnet);

// isTestnet is mocked, so the concrete currency value is irrelevant to routing.
const currency = { id: "cardano" } as CryptoCurrency;
const stakeKey = "stake1abc";

const apiDelegation = {
  deposit: "2000000",
  stakeHex: "deadbeef",
  status: true,
  stake: "1000000",
  rewardsAvailable: "500000",
  rewardsWithdrawn: "0",
  poolInfo: { poolId: "pool1xyz", name: "Ledger by Figment", ticker: "LBF" },
  dRepInfo: { hex: "drep1hex" },
};

describe("getDelegationInfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GETs the mainnet delegation endpoint with the stake key and maps the payload", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: { delegation: apiDelegation } } as never);

    const result = await getDelegationInfo(currency, stakeKey);

    expect(result).toEqual({
      status: true,
      deposit: "2000000",
      poolId: "pool1xyz",
      dRepHex: "drep1hex",
      ticker: "LBF",
      name: "Ledger by Figment",
      rewards: new BigNumber("500000"),
    });
    const call = mockNetwork.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.url).toContain("cardano.coin.ledger.com");
    expect(call.url).toMatch(/\/v1\/delegation$/);
    expect(call.params).toEqual({ stakeKey });
  });

  it("returns undefined when the response carries no delegation", async () => {
    mockIsTestnet.mockReturnValue(false);
    mockNetwork.mockResolvedValue({ data: {} } as never);

    await expect(getDelegationInfo(currency, stakeKey)).resolves.toBeUndefined();
  });

  it("routes to the testnet endpoint for a testnet currency", async () => {
    mockIsTestnet.mockReturnValue(true);
    mockNetwork.mockResolvedValue({ data: { delegation: apiDelegation } } as never);

    await getDelegationInfo(currency, stakeKey);

    expect(mockIsTestnet).toHaveBeenCalledWith(currency);
    expect(mockNetwork.mock.calls[0][0].url).toContain("cardanoscan");
  });
});
