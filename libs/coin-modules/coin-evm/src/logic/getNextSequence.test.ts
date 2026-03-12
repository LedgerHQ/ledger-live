import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { getNextSequence } from "./getNextSequence";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("getNextSequence", () => {
  const externalMocks = mockNodeApi();
  const ledgerMocks = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((currency: CryptoCurrency) => {
      const config = getCoinConfig(currency);
      return config?.info?.node?.type === "ledger" ? ledgerMocks : externalMocks;
    });
  });

  it.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("returns next sequence for an address using %s", async (_, type, nodeApiMock) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    nodeApiMock.getTransactionCount.mockResolvedValue(42);

    expect(await getNextSequence({} as CryptoCurrency, "")).toEqual(42n);
  });
});
