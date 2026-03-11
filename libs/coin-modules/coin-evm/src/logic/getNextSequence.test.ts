import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import ledgerNode from "../network/node/ledger";
import { getNextSequence } from "./getNextSequence";

const mockGetTransactionCount = jest.fn();
jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));
jest.mock("../network/node/ledger", () => ({
  __esModule: true,
  default: {
    getTransactionCount: jest.fn(),
  },
}));

const mockGetNodeApi = jest.mocked(getNodeApi);
const mockLedgerGetTransactionCount = ledgerNode.getTransactionCount as jest.Mock;

describe("getNextSequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((currency: CryptoCurrency) => {
      const c = getCoinConfig(currency) as { info?: { node?: { type?: string } } };
      if (c?.info?.node?.type === "ledger") {
        return { getTransactionCount: mockLedgerGetTransactionCount } as any;
      }
      return { getTransactionCount: mockGetTransactionCount } as any;
    });
  });

  it.each([
    ["an external node", "external", mockGetTransactionCount],
    ["a ledger node", "ledger", mockLedgerGetTransactionCount],
  ])("returns next sequence for an address using %s", async (_, type, mockTxCount) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    mockTxCount.mockResolvedValue(42);

    expect(await getNextSequence({} as CryptoCurrency, "")).toEqual(42n);
  });
});
