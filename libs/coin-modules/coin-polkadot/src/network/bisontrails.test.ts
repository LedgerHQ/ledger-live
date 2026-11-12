import BigNumber from "bignumber.js";
import { DEFAULT_MAX_TX_QUERY } from "../constants";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import { getOperations } from "./bisontrails";

const mockNetwork = jest.fn();
jest.mock("@ledgerhq/live-network/network", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockNetwork(...args),
}));

const address = "1a1LcBX6hGPKg5aQ6DXZpAHCCzWjckhea4sz3P1PvL3oc4F";

const extrinsic = (section: string, method: string, index: number) => ({
  hash: `0xhash${index}`,
  section,
  method,
  index,
  signer: address,
  affectedAddress1: address,
  nonce: index,
  blockNumber: 100 + index,
  timestamp: 1_700_000_000_000 + index,
  isSuccess: true,
  partialFee: "10",
  amount: "1",
});

const page = (extrinsics: unknown[]) => ({ data: { extrinsics, rewards: [], slashes: [] } });

describe("getOperations", () => {
  const logger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries the indexer with the default page size when none is configured", async () => {
    mockNetwork.mockResolvedValue(page([]));

    await getOperations(logger, polkadotMainnetConfigValue, "accountId", address);

    expect(mockNetwork.mock.lastCall[0].url).toContain(`limit=${DEFAULT_MAX_TX_QUERY}`);
  });

  it("queries the indexer with the configured page size", async () => {
    const config = {
      ...polkadotMainnetConfigValue,
      indexer: { ...polkadotMainnetConfigValue.indexer, maxTxQuery: 3 },
    };
    mockNetwork.mockResolvedValue(page([]));

    await getOperations(logger, config, "accountId", address);

    expect(mockNetwork.mock.lastCall[0].url).toContain("limit=3");
  });

  it("fetches the next page at an offset of the configured page size", async () => {
    const config = {
      ...polkadotMainnetConfigValue,
      indexer: { ...polkadotMainnetConfigValue.indexer, maxTxQuery: 2 },
    };
    mockNetwork
      .mockResolvedValueOnce(
        page([
          extrinsic("balances", "transferKeepAlive", 1),
          extrinsic("balances", "transferKeepAlive", 2),
        ]),
      )
      .mockResolvedValueOnce(page([extrinsic("balances", "transferKeepAlive", 3)]));

    const operations = await getOperations(logger, config, "accountId", address);

    expect(mockNetwork.mock.calls.map(([{ url }]) => url.includes("offset=2"))).toEqual([
      false,
      true,
    ]);
    expect(operations).toHaveLength(3);
  });

  it("logs unknown operation types through the injected logger", async () => {
    mockNetwork.mockResolvedValue(page([extrinsic("foo", "bar", 1)]));

    await getOperations(logger, polkadotMainnetConfigValue, "accountId", address);

    expect(logger).toHaveBeenCalledWith(
      "polkadot/api",
      "Unknown operation type foo.bar - fallback to FEES",
    );
  });

  it("defaults missing indexer amounts, fees and nonce instead of throwing", async () => {
    const {
      amount: _amount,
      partialFee: _fee,
      nonce: _nonce,
      ...bare
    } = extrinsic("balances", "transferKeepAlive", 1);
    mockNetwork.mockResolvedValue({
      data: {
        extrinsics: [bare, { ...bare, hash: "0xbond", method: "bond", amount: "n/a" }],
        rewards: [{ extrinsicHash: "0xreward", index: 2, accountId: address }],
        slashes: [{ blockNumber: 3, index: 3, accountId: address }],
      },
    });

    const operations = await getOperations(
      logger,
      polkadotMainnetConfigValue,
      "accountId",
      address,
    );

    expect(operations.map(op => [op.type, op.value, op.fee])).toEqual(
      expect.arrayContaining([
        ["OUT", new BigNumber(0), new BigNumber(0)],
        ["BOND", new BigNumber(0), new BigNumber(0)],
        ["REWARD_PAYOUT", new BigNumber(0), new BigNumber(0)],
        ["SLASH", new BigNumber(0), new BigNumber(0)],
      ]),
    );
    const out = operations.find(op => op.type === "OUT");
    expect(out?.transactionSequenceNumber).toBeUndefined();
    expect(out?.extra.transferAmount).toBeUndefined();
  });
});
