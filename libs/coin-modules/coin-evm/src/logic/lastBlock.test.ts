import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import ledgerNode from "../network/node/ledger";
import { lastBlock } from "./lastBlock";

const mockGetBlockByHeight = jest.fn();
jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));
jest.mock("../network/node/ledger", () => ({
  __esModule: true,
  default: {
    getBlockByHeight: jest.fn(),
  },
}));

const mockGetNodeApi = jest.mocked(getNodeApi);
const mockLedgerGetBlockByHeight = ledgerNode.getBlockByHeight as jest.Mock;

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((currency: CryptoCurrency) => {
      const c = getCoinConfig(currency) as { info?: { node?: { type?: string } } };
      if (c?.info?.node?.type === "ledger") {
        return { getBlockByHeight: mockLedgerGetBlockByHeight } as any;
      }
      return { getBlockByHeight: mockGetBlockByHeight } as any;
    });
  });

  it.each([
    ["an external node", "external", mockGetBlockByHeight],
    ["a ledger node", "ledger", mockLedgerGetBlockByHeight],
  ])("returns last block info using %s", async (_, type, mockBlockByHeight) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    mockBlockByHeight.mockResolvedValue({
      hash: "hash",
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
