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
});
