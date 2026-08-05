import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import BigNumber from "bignumber.js";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { apiClient } from "./network/api";
import { setHederaPreloadData } from "./preload-data";

jest.mock("./preload-data", () => ({
  setHederaPreloadData: jest.fn(),
}));

jest.mock("./network/api");

describe("getPreloadStrategy", () => {
  it("returns preloadMaxAge of 15 minutes in milliseconds", () => {
    const strategy = getPreloadStrategy();
    expect(strategy.preloadMaxAge).toBe(15 * 60 * 1000);
  });
});

describe("preload", () => {
  const currency = getCryptoCurrencyById("hedera");
  const mockGetNodes = jest.mocked(apiClient.getNodes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call getNodes with fetchAllPages=true and call setHederaPreloadData with mapped validators", async () => {
    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: 0,
          node_account_id: "0.0.3",
          description: "Hedera | 0 | Hosted by Hedera",
          min_stake: 1000,
          max_stake: 100000,
          stake: 50000,
          stake_rewarded: 30000,
          reward_rate_start: 0,
        },
      ],
      nextCursor: null,
    });

    const result = await preload(currency);

    expect(mockGetNodes).toHaveBeenCalledTimes(1);
    expect(mockGetNodes).toHaveBeenCalledWith({
      configOrCurrencyId: currency.id,
      fetchAllPages: true,
    });
    expect(setHederaPreloadData).toHaveBeenCalledTimes(1);
    expect(result.validators).toHaveLength(1);
    expect(result.validators[0]).toMatchObject({
      nodeId: 0,
      address: "0.0.3",
      minStake: new BigNumber(1000),
      maxStake: new BigNumber(100000),
      activeStake: new BigNumber(30000),
      overstaked: false,
    });
  });

  it("should set activeStakePercentage to 0 when maxStake is 0", async () => {
    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: 1,
          node_account_id: "0.0.4",
          description: "Hedera | 1 | Hosted by Hashpack",
          min_stake: 0,
          max_stake: 0,
          stake: 0,
          stake_rewarded: 0,
          reward_rate_start: 0,
        },
      ],
      nextCursor: null,
    });

    const result = await preload(currency);

    expect(result.validators[0].activeStakePercentage).toEqual(new BigNumber(0));
  });

  it("should mark validator as overstaked when activeStake >= maxStake", async () => {
    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: 2,
          node_account_id: "0.0.5",
          description: "Hedera | 2 | Overstaked node",
          min_stake: 0,
          max_stake: 1000,
          stake: 2000,
          stake_rewarded: 1000,
          reward_rate_start: 0,
        },
      ],
      nextCursor: null,
    });

    const result = await preload(currency);

    expect(result.validators[0].overstaked).toBe(true);
  });

  it("should return empty validators array when nodes list is empty", async () => {
    mockGetNodes.mockResolvedValue({ nodes: [], nextCursor: null });

    const result = await preload(currency);

    expect(result.validators).toEqual([]);
    expect(setHederaPreloadData).toHaveBeenCalledTimes(1);
    expect(setHederaPreloadData).toHaveBeenCalledWith({ validators: [] }, currency);
  });
});

describe("hydrate", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([undefined, null, {}, []])(
    "should hydrate empty validators list if data is corrupted (%p value)",
    value => {
      hydrate(value, currency);
      expect(setHederaPreloadData).toHaveBeenCalledTimes(1);
      expect(setHederaPreloadData).toHaveBeenCalledWith({ validators: [] }, currency);
    },
  );

  it("should hydrate empty validators when validators field is not an array", () => {
    hydrate({ validators: "not-an-array" }, currency);
    expect(setHederaPreloadData).toHaveBeenCalledTimes(1);
    expect(setHederaPreloadData).toHaveBeenCalledWith({ validators: [] }, currency);
  });

  it("should hydrate valid validators list", () => {
    hydrate(
      {
        validators: [
          {
            nodeId: 1,
            address: "0.0.1",
            addressChecksum: "abcde",
            name: "Ledger",
            minStake: "1",
            maxStake: "10",
            activeStake: "5",
            activeStakePercentage: "50",
            overstaked: false,
          },
        ],
      },
      currency,
    );

    expect(setHederaPreloadData).toHaveBeenCalledTimes(1);
    expect(setHederaPreloadData).toHaveBeenCalledWith(
      {
        validators: [
          {
            nodeId: 1,
            address: "0.0.1",
            addressChecksum: "abcde",
            name: "Ledger",
            minStake: new BigNumber(1),
            maxStake: new BigNumber(10),
            activeStake: new BigNumber(5),
            activeStakePercentage: new BigNumber(50),
            overstaked: false,
          },
        ],
      },
      currency,
    );
  });
});
