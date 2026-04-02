import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { lastBlock } from "./lastBlock";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("lastBlock", () => {
  const externalMocks = mockNodeApi();
  const ledgerMocks = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((currency: CryptoCurrency) => {
      const config = getCoinConfig(currency.id);
      return config?.info?.node?.type === "ledger" ? ledgerMocks : externalMocks;
    });
  });

  it.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("returns last block info using %s", async (_, type, nodeApiMock) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    nodeApiMock.getBlockByHeight.mockResolvedValue({
      hash: "hash",
      parentHash: "parentHash",
      height: 33,
      timestamp: new Date("2025-12-31").getTime(),
    });

    expect(await lastBlock({} as CryptoCurrency)).toEqual({
      hash: "hash",
      height: 33,
      time: new Date("2025-12-31"),
    });
  });
});
